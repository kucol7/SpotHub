import ProfileSidebar from "../../../components/ProfileSidebar";

export default function ProfileDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      <aside className="w-64 shrink-0 border-r border-white/5">
        <ProfileSidebar />
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
