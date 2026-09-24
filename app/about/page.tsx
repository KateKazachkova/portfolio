import Binder from "@/components/profile/Binder";
import { SPREADS } from "@/components/profile/spreads";

export const metadata = {
  title: "Profile – Kate Kazachkova",
  description: "The professional specification of the KATE™ model: overview, field history, teaching and specifications.",
};

export default function Profile() {
  return (
    <main className="min-h-screen px-4 md:px-8 py-10">
      <h1 className="sr-only">Profile – Kate Kazachkova</h1>
      <Binder spreads={SPREADS} />
    </main>
  );
}
