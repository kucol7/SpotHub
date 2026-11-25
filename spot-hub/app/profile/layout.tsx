import Navbar from "../../components/Navbar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white">
      <Navbar />
      {children}
    </div>
  );
}
