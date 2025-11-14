import Image from "next/image";
import logoPng from "@/public/itaurus-logo.png";
import Link from "next/link";

import { LoginForm } from "@/components/ui/login-form";

export default function LoginPage() {
  return (
    <div className="bg-black flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image
            width={40}
            height={15}
            src={logoPng}
            alt="iTaurus Wartungsmanagement Logo"
            priority
          />
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}