import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireHelper — Full-stack project ready in /frontend & /backend" },
      { name: "description", content: "MERN HireHelper app. Run /frontend and /backend in VS Code." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#eef4ff] to-white text-slate-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <span className="inline-block px-3 py-1 rounded-full bg-[#dbe6ff] text-[#1f42b8] text-xs font-bold">
          ✓ Project generated
        </span>
        <h1 className="mt-5 text-4xl font-extrabold text-slate-900">
          HireHelper is ready to run in VS Code
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          The full MERN app lives in two folders at the project root —{" "}
          <code className="px-1.5 py-0.5 bg-slate-100 rounded">frontend/</code> and{" "}
          <code className="px-1.5 py-0.5 bg-slate-100 rounded">backend/</code>. The Lovable preview
          can only run one app at a time, so download the project and run it locally.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <Card title="① Backend (Express + MongoDB Atlas)" steps={[
            "cd backend",
            "npm install",
            "cp .env.example .env   (edit MONGO_URI, SMTP, ADMIN_*)",
            "npm run dev   → :5000",
          ]} />
          <Card title="② Frontend (React + Vite + Tailwind)" steps={[
            "cd frontend",
            "npm install",
            "cp .env.example .env",
            "npm run dev   → :5173",
          ]} />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-lg">📍 Where to plug in MongoDB Atlas</h2>
          <p className="mt-2 text-slate-600 text-sm">
            Open <code className="px-1.5 py-0.5 bg-slate-100 rounded">backend/.env</code> and set:
          </p>
          <pre className="mt-3 bg-slate-900 text-emerald-300 rounded-xl p-4 text-xs overflow-x-auto">
{`MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/hirehelper`}
          </pre>
          <p className="mt-3 text-sm text-slate-600">
            All authentication, OTP, tasks, requests and admin endpoints already use this connection
            via Mongoose. Full guide in <code>README.md</code>, <code>backend/README.md</code>, and{" "}
            <code>frontend/README.md</code>.
          </p>
        </div>

        <div className="mt-6 text-sm text-slate-500">
          Tip: open the project root in VS Code and run the two <code>npm run dev</code> commands in
          separate terminals.
        </div>
      </div>
    </div>
  );
}

function Card({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold">{title}</h3>
      <ol className="mt-3 space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
        {steps.map((s) => <li key={s}><code className="text-slate-800">{s}</code></li>)}
      </ol>
    </div>
  );
}
