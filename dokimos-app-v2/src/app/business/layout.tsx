export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="verifier-theme min-h-screen bg-dokimos-verifierCanvas font-sans antialiased text-gray-900">
      {children}
    </div>
  );
}
