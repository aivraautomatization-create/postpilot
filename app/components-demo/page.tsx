import Link from 'next/link';

export default function ComponentsDemoGallery() {
  const demos = [
    { name: "Wave Background", path: "/components-demo/wave" },
    { name: "Sign-In Flow", path: "/components-demo/sign-in" },
    { name: "Auth Page", path: "/components-demo/auth" },
    { name: "Onboarding Multistep Form", path: "/components-demo/onboarding" },
    { name: "Interactive Hover Button", path: "/components-demo/hover-button" },
    { name: "Placeholders & Vanish Input", path: "/components-demo/vanish-input" },
    { name: "Interactive Image Accordion", path: "/components-demo/accordion" },
  ];

  return (
    <div className="container mx-auto p-8 pt-32">
      <h1 className="text-4xl font-bold mb-8 tracking-tight">UI Components Gallery</h1>
      <p className="text-muted-foreground mb-12 max-w-2xl text-lg">
        Explore the interactive UI components you have integrated into the codebase. Click on any card to view the live component demonstration.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <Link 
            key={demo.path} 
            href={demo.path}
            className="group block p-6 rounded-2xl border bg-card text-card-foreground hover:shadow-xl hover:border-primary/50 transition-all hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{demo.name}</h2>
            <p className="text-muted-foreground text-sm font-medium flex items-center">
              View Component Demo 
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
