import { AuthHeader } from "@/components/templates/auth-header";
import { AuthFooter } from "@/components/templates/auth-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pt-16">
      <AuthHeader />
      <div className="of-login-v2-screen flex-1 flex items-center justify-center">
        {children}
      </div>
      <AuthFooter />
    </div>
  );
}
