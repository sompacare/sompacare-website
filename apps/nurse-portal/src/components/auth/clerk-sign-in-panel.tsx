import { SignIn } from "@clerk/nextjs";

type Props = {
  forceRedirectUrl?: string;
};

export function ClerkSignInPanel({ forceRedirectUrl = "/home" }: Props) {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      forceRedirectUrl={forceRedirectUrl}
      appearance={{
        elements: {
          rootBox: "w-full",
          cardBox: "w-full shadow-none",
          card: "shadow-none p-0 gap-4",
        },
      }}
    />
  );
}
