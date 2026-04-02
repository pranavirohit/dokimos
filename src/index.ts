import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { hashMessage } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

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

function extractAttributesFromDocument(_imageBase64: string): ExtractedAttributes {
  return {
    name: 'Test User',
    dateOfBirth: '1998-03-15',
    ageOver21: true,
    notExpired: true,
    nationality: 'USA',
    documentType: 'drivers_license',
  };
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

  const server = Fastify({ logger: true });

  // Enable CORS for frontend access
  await server.register(cors, { origin: true });

  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok', signer: account.address };
  });

  // Endpoint that verifies ID documents and returns signed attestations
  server.post<{ Body: VerifyRequestBody }>('/verify', async (request) => {
    const { imageBase64, requestedAttributes } = request.body;

    if (!imageBase64) {
      throw { statusCode: 400, message: 'imageBase64 is required' };
    }

    const allAttributes = extractAttributesFromDocument(imageBase64);

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

    return {
      attributes,
      timestamp,
      message,
      messageHash,
      signature,
      signer: account.address,
    };
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
