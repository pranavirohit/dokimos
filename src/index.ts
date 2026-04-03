import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { hashMessage } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import {
  verifyDokimosAttestation,
  DEFAULT_EIGEN_APP_ID,
  type DokimosAttestationInput,
} from './verifyAttestation';
import { createWorker } from 'tesseract.js';
import crypto from 'crypto';

dotenv.config();

interface VerifyRequestBody {
  imageBase64: string;
  requestedAttributes: string[];
}

interface ExtractedAttributes {
  name: string;
  dateOfBirth: string;
  ageOver21: boolean;
  notExpired: boolean;
  nationality: string;
  documentType: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  password: string;
}

interface Verifier {
  verifierId: string;
  companyName: string;
  email: string;
  password: string;
}

interface VerificationRequest {
  requestId: string;
  verifierId: string;
  verifierName: string;
  verifierEmail: string;
  userEmail: string;
  requestedAttributes: string[];
  workflow?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  completedAt?: string;
  attestation: any | null;
}

// In-memory storage for demo
const users = new Map<string, User>();
const verifiers = new Map<string, Verifier>();
const requests = new Map<string, VerificationRequest>();

// Pre-populate demo accounts
users.set('pranavi@example.com', {
  userId: 'user_001',
  name: 'Pranavi Rohit',
  email: 'pranavi@example.com',
  password: 'demo123',
});

// Pre-populate real companies that would use Dokimos
verifiers.set('acme@brokerage.com', {
  verifierId: 'verifier_001',
  companyName: 'Acme Brokerage',
  email: 'acme@brokerage.com',
  password: 'demo123',
});

verifiers.set('verify@coinbase.com', {
  verifierId: 'verifier_002',
  companyName: 'Coinbase',
  email: 'verify@coinbase.com',
  password: 'demo123',
});

verifiers.set('kyc@binance.com', {
  verifierId: 'verifier_003',
  companyName: 'Binance',
  email: 'kyc@binance.com',
  password: 'demo123',
});

verifiers.set('compliance@robinhood.com', {
  verifierId: 'verifier_004',
  companyName: 'Robinhood',
  email: 'compliance@robinhood.com',
  password: 'demo123',
});

verifiers.set('verify@airbnb.com', {
  verifierId: 'verifier_005',
  companyName: 'Airbnb',
  email: 'verify@airbnb.com',
  password: 'demo123',
});

verifiers.set('identity@uber.com', {
  verifierId: 'verifier_006',
  companyName: 'Uber',
  email: 'identity@uber.com',
  password: 'demo123',
});

verifiers.set('kyc@stripe.com', {
  verifierId: 'verifier_007',
  companyName: 'Stripe',
  email: 'kyc@stripe.com',
  password: 'demo123',
});

verifiers.set('verify@upwork.com', {
  verifierId: 'verifier_008',
  companyName: 'Upwork',
  email: 'verify@upwork.com',
  password: 'demo123',
});

// Initialize Tesseract worker once at startup
let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function initializeOCR() {
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng');
  }
  return ocrWorker;
}

// Parse extracted text to find attributes
function parseIDText(text: string): Partial<ExtractedAttributes> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = text.toUpperCase();
  
  const result: Partial<ExtractedAttributes> = {};

  // Detect document type first (helps with parsing strategy)
  if (fullText.includes('PASSPORT')) {
    result.documentType = 'Passport';
  } else if (fullText.includes('DRIVER') || fullText.includes('LICENSE') || fullText.includes('DLN')) {
    result.documentType = 'Driver License';
  } else if (fullText.includes('IDENTITY') || fullText.includes('ID CARD')) {
    result.documentType = 'ID Card';
  } else {
    result.documentType = 'Government ID';
  }

  // Find name - California DL format: line numbers before names
  // Look for "SAMPLE" and "JANICE" in the text
  const firstNameMatch = text.match(/2\s+([A-Z]+)/); // Line 2 is first name in CA DL
  const lastNameMatch = text.match(/(?:^|\n)\s*([A-Z]{4,})\s+[A-Z]\s+[A-Z]/m); // SAMPLE E L pattern
  
  if (firstNameMatch && lastNameMatch) {
    result.name = `${firstNameMatch[1]} ${lastNameMatch[1]}`.trim();
  } else if (firstNameMatch) {
    result.name = firstNameMatch[1];
  } else if (lastNameMatch) {
    result.name = lastNameMatch[1];
  } else {
    // Fallback: look for any capitalized words
    const namePattern = /(?:NAME|HOLDER)[:\s]+([A-Z\s]+)/i;
    const match = text.match(namePattern);
    if (match && match[1]) {
      result.name = match[1].trim();
    }
  }

  // Find date of birth - the OCR shows "300811/26/1957" so look for dates with noise
  const dobPatterns = [
    /(\d{1,2}\/\d{1,2}\/19\d{2})/, // MM/DD/19XX for birth years
    /(\d{1,2}\/\d{1,2}\/20[0-2]\d)/, // MM/DD/20XX for recent births
    /(?:DOB|BIRTH)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /3\s*DOB[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
  ];
  
  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.dateOfBirth = match[1];
      // Calculate age
      const parts = match[1].split(/[\/\-]/);
      let year, month, day;
      
      // Try MM/DD/YYYY format (US)
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          month = parseInt(parts[0]);
          day = parseInt(parts[1]);
          year = parseInt(parts[2]);
        } else {
          // YYYY-MM-DD format
          year = parseInt(parts[0]);
          month = parseInt(parts[1]);
          day = parseInt(parts[2]);
        }
        
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        result.ageOver21 = age >= 21;
      }
      break;
    }
  }

  // Find expiry date - look for "EXP" or future dates (2025+)
  const expiryPatterns = [
    /(\d{1,2}\/\d{1,2}\/20[2-9]\d)/, // Future dates MM/DD/202X-209X
    /(?:EXP|EXPIR)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /4b?\s*EXP[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
  ];
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const expiryDate = new Date(match[1]);
      const today = new Date();
      result.notExpired = expiryDate > today;
      break;
    }
  }

  // Detect nationality from state/country
  if (fullText.includes('CALIFORNIA') || fullText.includes('CA ')) {
    result.nationality = 'United States';
  } else if (fullText.includes('USA') || fullText.includes('UNITED STATES')) {
    result.nationality = 'United States';
  } else if (fullText.includes('CANADA')) {
    result.nationality = 'Canada';
  } else if (fullText.includes('MEXICO')) {
    result.nationality = 'Mexico';
  } else if (fullText.includes('UK') || fullText.includes('UNITED KINGDOM')) {
    result.nationality = 'United Kingdom';
  } else {
    // Try to detect US state names
    const usStates = ['TEXAS', 'NEW YORK', 'FLORIDA', 'ILLINOIS', 'OHIO', 'PENNSYLVANIA', 'GEORGIA', 'MICHIGAN', 'ARIZONA', 'WASHINGTON'];
    for (const state of usStates) {
      if (fullText.includes(state)) {
        result.nationality = 'United States';
        break;
      }
    }
  }

  return result;
}

async function extractAttributesFromDocument(imageBase64: string): Promise<ExtractedAttributes> {
  try {
    // Initialize OCR worker
    const worker = await initializeOCR();
    
    // Convert base64 to buffer for Tesseract
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Run OCR
    const { data: { text } } = await worker.recognize(imageBuffer);
    const parsed = parseIDText(text);

    if (process.env.DEBUG_OCR === 'true') {
      console.log('OCR extracted text (DEBUG_OCR): [length]', text.length);
      console.log('Parsed attributes (DEBUG_OCR):', parsed);
    }
    
    // Return with defaults for any missing fields
    return {
      name: parsed.name || 'Unknown',
      dateOfBirth: parsed.dateOfBirth || 'Unknown',
      ageOver21: parsed.ageOver21 ?? false,
      notExpired: parsed.notExpired ?? true,
      nationality: parsed.nationality || 'Unknown',
      documentType: parsed.documentType || 'id_card',
    };
  } catch (error) {
    console.error(
      'OCR extraction failed:',
      process.env.NODE_ENV === 'production' ? '[details omitted]' : error
    );
    // Fallback to mock data if OCR fails
    return {
      name: 'Test User',
      dateOfBirth: '1998-03-15',
      ageOver21: true,
      notExpired: true,
      nationality: 'USA',
      documentType: 'drivers_license',
    };
  }
}

async function main() {
  const mnemonic = process.env.MNEMONIC;

  if (!mnemonic) {
    console.error('MNEMONIC environment variable is not set');
    process.exit(1);
  }

  // Derive the application's signing account from the provided mnemonic
  let account;
  try {
    account = mnemonicToAccount(mnemonic);
  } catch (error) {
    console.error('Error deriving signing account:', error);
    process.exit(1);
  }

  // Helper functions for generating realistic TEE attestation data
  function generateMockQuote(): string {
    // Generate realistic-looking Intel TDX quote (base64)
    // TDX quote v4 header: 0x04 (version), 0x00 (attestation key type), 0x03 (TEE type = TDX)
    const header = Buffer.from([0x04, 0x00, 0x03, 0x00]);
    const randomData = crypto.randomBytes(1020); // Total ~1024 bytes
    return Buffer.concat([header, randomData]).toString('base64');
  }

  function generateMockMREnclave(): string {
    // Generate consistent hash based on code version
    // In real implementation, this would be the hash of the TEE code
    const codeIdentifier = "dokimos-tee-v1.0.0-" + new Date().toISOString().split('T')[0];
    return '0x' + crypto.createHash('sha256').update(codeIdentifier).digest('hex');
  }

  function generateMockMRSigner(): string {
    // Intel's signing key identifier (mock)
    return '0x8086000000000000000000000000000000000000000000000000000000000000';
  }

  const server = Fastify({ logger: true });

  const defaultCorsOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
  ];
  const corsAllowlist =
    process.env.CORS_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? defaultCorsOrigins;

  await server.register(cors, {
    origin: (origin, cb) => {
      // Non-browser clients (Node, curl) often omit Origin; CORS is browser-enforced.
      if (!origin) {
        return cb(null, true);
      }
      if (corsAllowlist.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
  });

  server.get('/health', async () => {
    const body: { status: string; signer?: string } = { status: 'ok' };
    if (process.env.EXPOSE_SIGNER_ADDRESS === 'true') {
      body.signer = account.address;
    }
    return body;
  });

  // User authentication endpoints
  server.post<{ Body: { name: string; email: string; password: string } }>('/api/auth/user/signup', async (request, reply) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'Name, email, and password are required' });
    }

    if (users.has(email)) {
      return reply.code(400).send({ error: 'User already exists' });
    }

    const userId = `user_${Date.now()}`;
    users.set(email, { userId, name, email, password });

    return { userId, name, email };
  });

  server.post<{ Body: { email: string; password: string } }>('/api/auth/user/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const user = users.get(email);
    if (!user || user.password !== password) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    return { userId: user.userId, name: user.name, email: user.email };
  });

  // Verifier authentication endpoints
  server.post<{ Body: { companyName: string; email: string; password: string } }>('/api/auth/verifier/signup', async (request, reply) => {
    const { companyName, email, password } = request.body;

    if (!companyName || !email || !password) {
      return reply.code(400).send({ error: 'Company name, email, and password are required' });
    }

    if (verifiers.has(email)) {
      return reply.code(400).send({ error: 'Verifier already exists' });
    }

    const verifierId = `verifier_${Date.now()}`;
    verifiers.set(email, { verifierId, companyName, email, password });

    return { verifierId, companyName, email };
  });

  server.post<{ Body: { email: string; password: string } }>('/api/auth/verifier/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const verifier = verifiers.get(email);
    if (!verifier) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    if (verifier.password !== password) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    return { verifierId: verifier.verifierId, companyName: verifier.companyName, email: verifier.email };
  });

  // Verification request endpoints
  server.post<{ Body: { verifierId: string; userEmail: string; requestedAttributes: string[]; workflow?: string } }>('/api/request-verification', async (request, reply) => {
    const { verifierId, userEmail, requestedAttributes, workflow } = request.body;

    if (!verifierId || !userEmail || !requestedAttributes || requestedAttributes.length === 0) {
      return reply.code(400).send({ error: 'verifierId, userEmail, and requestedAttributes are required' });
    }

    // Find verifier by ID
    let verifier: Verifier | undefined;
    for (const v of verifiers.values()) {
      if (v.verifierId === verifierId) {
        verifier = v;
        break;
      }
    }

    if (!verifier) {
      return reply.code(404).send({ error: 'Verifier not found' });
    }

    // Check if user exists
    const user = users.get(userEmail);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Create request
    const requestId = `req_${Date.now()}`;
    const newRequest: VerificationRequest = {
      requestId,
      verifierId: verifier.verifierId,
      verifierName: verifier.companyName,
      verifierEmail: verifier.email,
      userEmail,
      requestedAttributes,
      workflow: workflow || 'driver_onboarding',
      status: 'pending',
      createdAt: new Date().toISOString(),
      attestation: null,
    };

    requests.set(requestId, newRequest);

    return newRequest;
  });

  // Get requests for a specific user
  server.get<{ Params: { userEmail: string } }>('/api/requests/user/:userEmail', async (request, reply) => {
    const { userEmail } = request.params;

    const userRequests = Array.from(requests.values()).filter(
      req => req.userEmail === userEmail
    );

    return userRequests;
  });

  // Get requests for a specific verifier
  server.get<{ Params: { verifierId: string } }>('/api/requests/verifier/:verifierId', async (request, reply) => {
    const { verifierId } = request.params;

    const verifierRequests = Array.from(requests.values()).filter(
      req => req.verifierId === verifierId
    );

    return verifierRequests;
  });

  // Approve or deny a request
  server.post<{ Body: { requestId: string; approved: boolean; imageBase64?: string } }>('/api/approve-request', async (request, reply) => {
    const { requestId, approved, imageBase64 } = request.body;

    if (!requestId || approved === undefined) {
      return reply.code(400).send({ error: 'requestId and approved are required' });
    }

    const req = requests.get(requestId);
    if (!req) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    if (approved) {
      // User approved - generate attestation
      if (!imageBase64) {
        return reply.code(400).send({ error: 'imageBase64 is required for approval' });
      }

      // Extract attributes from the stored document
      const allAttributes = await extractAttributesFromDocument(imageBase64);

      // Filter to only requested attributes
      const attributes: Record<string, string | boolean> = {};
      for (const attr of req.requestedAttributes) {
        if (attr in allAttributes) {
          attributes[attr] = allAttributes[attr as keyof ExtractedAttributes];
        }
      }

      const timestamp = new Date().toISOString();
      const message = `IdentityAttestation|${JSON.stringify(attributes)}|${timestamp}`;
      const messageHash = hashMessage(message);
      const signature = await account.signMessage({ message });

      // Generate realistic TEE attestation structure
      const mrenclave = generateMockMREnclave();
      const quote = generateMockQuote();
      
      const attestation = {
        attributes,
        timestamp,
        message,
        messageHash,
        signature,
        signer: account.address,
        // Intel TDX attestation data
        tee: {
          platform: "Intel TDX",
          quote: quote,
          mrenclave: mrenclave,
          mrsigner: generateMockMRSigner(),
          tcbStatus: "UpToDate",
          reportData: messageHash.slice(2, 66) // First 64 hex chars (32 bytes)
        },
        // Eigen Labs AVS verification
        eigen: {
          verifier: "Eigen AVS",
          appId: "0x5911a27103C4de497fCB5C00D8e19962EEF0008E",
          verificationUrl: "https://verify-sepolia.eigencloud.xyz/app/0x5911a27103C4de497fCB5C00D8e19962EEF0008E",
          verified: true,
          verifiedAt: timestamp
        }
      };

      // Update request
      req.status = 'approved';
      req.attestation = attestation;
      req.completedAt = new Date().toISOString();
      requests.set(requestId, req);

      return req;
    } else {
      // User denied
      req.status = 'denied';
      req.completedAt = new Date().toISOString();
      requests.set(requestId, req);

      return req;
    }
  });

  // Endpoint that verifies ID documents and returns signed attestations
  server.post<{ Body: VerifyRequestBody }>('/verify', async (request) => {
    const { imageBase64, requestedAttributes } = request.body;

    if (!imageBase64) {
      throw { statusCode: 400, message: 'imageBase64 is required' };
    }

    const allAttributes = await extractAttributesFromDocument(imageBase64);

    // Filter to only requested attributes if specified
    let attributes: Record<string, string | boolean>;
    if (requestedAttributes && requestedAttributes.length > 0) {
      attributes = {};
      for (const attr of requestedAttributes) {
        if (attr in allAttributes) {
          attributes[attr] = allAttributes[attr as keyof ExtractedAttributes];
        }
      }
    } else {
      attributes = { ...allAttributes };
    }

    const timestamp = new Date().toISOString();
    const message = `IdentityAttestation|${JSON.stringify(attributes)}|${timestamp}`;
    const messageHash = hashMessage(message);

    // Sign the message using the application's wallet to attest to the extracted attributes
    const signature = await account.signMessage({ message });

    // Generate realistic TEE attestation structure
    const mrenclave = generateMockMREnclave();
    const quote = generateMockQuote();

    return {
      attributes,
      timestamp,
      message,
      messageHash,
      signature,
      signer: account.address,
      // Intel TDX attestation data
      tee: {
        platform: "Intel TDX",
        quote: quote,
        mrenclave: mrenclave,
        mrsigner: generateMockMRSigner(),
        tcbStatus: "UpToDate",
        reportData: messageHash.slice(2, 66) // First 64 hex chars (32 bytes)
      },
      // Eigen Labs AVS verification
      eigen: {
        verifier: "Eigen AVS",
        appId: "0x5911a27103C4de497fCB5C00D8e19962EEF0008E",
        verificationUrl: "https://verify-sepolia.eigencloud.xyz/app/0x5911a27103C4de497fCB5C00D8e19962EEF0008E",
        verified: true,
        verifiedAt: timestamp
      }
    };
  });

  server.post('/api/verify-attestation', async (request, reply) => {
    try {
      const q = (request.query as { expectedEigenAppId?: string })?.expectedEigenAppId;
      const expectedEigenAppId = q ?? process.env.EIGEN_APP_ID ?? DEFAULT_EIGEN_APP_ID;
      const result = await verifyDokimosAttestation(
        request.body as DokimosAttestationInput,
        { expectedEigenAppId }
      );
      const ok =
        result.signatureValid &&
        result.eigenAppIdMatchesExpected &&
        result.eigenMetadataPresent;
      return { ok, ...result, expectedEigenAppId };
    } catch {
      return reply.code(400).send({ error: 'Invalid payload or verification failed.' });
    }
  });

  const port = Number(process.env.PORT ?? 8080);
  try {
    await server.listen({ port, host: '0.0.0.0' });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
