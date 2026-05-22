type ModulePageProps = {
  title: string;
  description: string;
  integrations: string[];
};

export function ModulePage({ title, description, integrations }: ModulePageProps) {
  return (
    <section className="of-page">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[#94a3c3]">{description}</p>
      </div>
      <div className="of-card">
        <p className="mb-2 text-sm font-medium text-[#e8edf8]">Comunicação ativa nesta fase:</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-[#94a3c3]">
          {integrations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
