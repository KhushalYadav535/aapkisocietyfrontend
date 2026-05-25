import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  showText?: boolean;
}

export function Logo({ size = "md", href = "/", showText = true }: LogoProps) {
  const sizes = {
    sm: { image: 40, text: "text-lg" },
    md: { image: 56, text: "text-2xl" },
    lg: { image: 80, text: "text-4xl" },
  };

  const logo = (
    <div className="flex items-center gap-3">
      <div className="relative w-fit">
        <Image
          src="/aapp.jpeg"
          alt="AapkiSociety Logo"
          width={sizes[size].image}
          height={sizes[size].image}
          priority
          className="rounded-lg"
        />
      </div>
      {showText && (
        <div>
          <h1 className={`${sizes[size].text} font-bold text-gray-900 tracking-tight`}>
            AapkiSociety
          </h1>
          <p className="text-xs text-gray-500">Manage. Connect. Simplify.</p>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logo}</Link>;
  }

  return logo;
}
