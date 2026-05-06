using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

static void Fail(string message)
{
  Console.Error.WriteLine(message);
  Environment.Exit(1);
}

if (args.Length is < 2 or > 3)
{
  Fail("Usage: dotnet run -- <certPemPath> <keyPemPath> <subject?>");
}

var certPemPath = args[0];
var keyPemPath = args[1];
var subject = args.Length >= 3 ? args[2] : "CN=localhost";

var certDir = Path.GetDirectoryName(certPemPath);
if (!string.IsNullOrWhiteSpace(certDir))
{
  Directory.CreateDirectory(certDir);
}

var keyDir = Path.GetDirectoryName(keyPemPath);
if (!string.IsNullOrWhiteSpace(keyDir))
{
  Directory.CreateDirectory(keyDir);
}

using var rsa = RSA.Create(2048);

var request = new CertificateRequest(
  new X500DistinguishedName(subject),
  rsa,
  HashAlgorithmName.SHA256,
  RSASignaturePadding.Pkcs1);

request.CertificateExtensions.Add(
  new X509BasicConstraintsExtension(false, false, 0, false));

request.CertificateExtensions.Add(
  new X509KeyUsageExtension(
    X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment,
    false));

request.CertificateExtensions.Add(
  new X509SubjectKeyIdentifierExtension(request.PublicKey, false));

var san = new SubjectAlternativeNameBuilder();
san.AddDnsName("localhost");
san.AddIpAddress(System.Net.IPAddress.Loopback);
san.AddIpAddress(System.Net.IPAddress.IPv6Loopback);
request.CertificateExtensions.Add(san.Build());

using var cert = request.CreateSelfSigned(
  DateTimeOffset.UtcNow.AddMinutes(-5),
  DateTimeOffset.UtcNow.AddYears(5));
File.WriteAllText(certPemPath, cert.ExportCertificatePem());

try
{
  File.WriteAllText(keyPemPath, rsa.ExportPkcs8PrivateKeyPem());
}
catch (CryptographicException ex)
{
  Fail($"Failed to export private key PEM: {ex.Message}");
}

Console.WriteLine($"Wrote cert: {certPemPath}");
Console.WriteLine($"Wrote key : {keyPemPath}");

