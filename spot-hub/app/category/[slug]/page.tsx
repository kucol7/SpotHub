import Navbar from "../../../components/Navbar";
import { Star, Eye, Play } from "lucide-react";
import { notFound } from "next/navigation";
import { getCategory, getCategorySlugs } from "../../../lib/categories";

export function generateStaticParams() {
  return getCategorySlugs().map((slug) => ({ slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold md:text-5xl mb-4 text-white">
            {category.title}
          </h1>
          <p className="max-w-2xl text-neutral-400 text-lg">
            {category.description}
          </p>
        </header>

        {category.seasons.map((season) => (
          <section key={season.title} className="mb-12">
            <h2 className="text-2xl font-semibold mb-8 text-white border-l-4 border-purple-600 pl-4">
              {season.title}
            </h2>

            <div className="flex flex-col gap-6">
              {season.videos.map((video, index) => (
                <div
                  key={video.id}
                  className="group flex flex-col md:flex-row gap-6 p-4 rounded-xl transition-all duration-300 hover:bg-neutral-900/50 cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="w-full md:w-80 shrink-0">
                    <div
                      className={`aspect-video rounded-lg overflow-hidden relative ${video.thumbnail} border border-neutral-800 group-hover:scale-[1.02] transition-transform duration-300 shadow-xl`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-16 w-16 text-purple-500 opacity-50" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold">
                        {video.duration}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {video.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" /> {video.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center py-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-3">
                      {index + 1}. {video.title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed max-w-xl line-clamp-3">
                      {video.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}