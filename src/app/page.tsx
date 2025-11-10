import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <section className="px-8 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Despre noi</h2>
        <p className="max-w-2xl mx-auto text-gray-700">
          Suntem un business local dedicat oferirii de produse de calitate superioară clienților noștri.
        </p>
      </section>
    </main>
  );
}
