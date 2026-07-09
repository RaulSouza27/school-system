import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { jsPDF } from "jspdf";
import { GraduationCap, FileDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Escola Paraíso da Criança — Declarações de Matrícula" },
      {
        name: "description",
        content:
          "Gere declarações de matrícula em PDF de forma rápida e simples para os alunos da Escola Paraíso da Criança.",
      },
      { property: "og:title", content: "Escola Paraíso da Criança — Declarações" },
      {
        property: "og:description",
        content: "Emissão rápida de declarações de matrícula em PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function formatDateBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function todayBR() {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function Index() {
  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [serie, setSerie] = useState("");
  const [escola, setEscola] = useState("ESCOLA PARAÍSO DA CRIANÇA");
  const [gerando, setGerando] = useState(false);

  const gerarPDF = async () => {
    setGerando(true);
    
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
      });
    };

    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await loadImage("/school_icon.png");
    } catch (error) {
      console.error("Erro ao carregar o logo para o PDF:", error);
    }

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const marginX = 25;
      let y = 30;

      // Cabeçalho decorativo
      doc.setDrawColor(232, 0, 0); // Vermelho principal
      doc.setLineWidth(1.2);
      doc.line(marginX, y - 8, pageW - marginX, y - 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(153, 27, 27); // Vermelho escuro
      const schoolLines = doc.splitTextToSize(escola.toUpperCase(), pageW - marginX * 2);
      schoolLines.forEach((line: string, idx: number) => {
        doc.text(line, pageW / 2, y + idx * 6, { align: "center" });
      });
      y += (schoolLines.length - 1) * 6;

      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(115, 115, 115);
      doc.text("Educação Infantil e Ensino Fundamental", pageW / 2, y, { align: "center" });

      y += 4;
      doc.setDrawColor(217, 119, 6); // Amarelo/Dourado secundário
      doc.setLineWidth(0.4);
      doc.line(marginX, y, pageW - marginX, y);

      // Título
      y += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(153, 27, 27);
      doc.text("DECLARAÇÃO DE MATRÍCULA", pageW / 2, y, { align: "center" });

      // Desenhar o Logo e alinhá-lo verticalmente com o título à direita
      if (logoImg) {
        // Título tem 20pt (cerca de 7mm de altura). 
        // Logo de 20mm x 20mm centrado verticalmente em relação ao título.
        doc.addImage(logoImg, "PNG", pageW - marginX - 20, y - 12, 20, 20);
      }

      // Corpo
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);

      const texto =
        `Declaramos, para os devidos fins, que o(a) aluno(a) ${nome || "____________________"}, ` +
        `nascido(a) em ${formatDateBR(nascimento) || "__/__/____"}, encontra-se regularmente ` +
        `matriculado(a) nesta instituição de ensino, cursando ${serie || "____________________"} ` +
        `no presente ano letivo.\n\n` +
        `Por ser expressão da verdade, firmamos a presente declaração.`;

      const textWidth = pageW - marginX * 2;
      const linhas = doc.splitTextToSize(texto, textWidth);
      doc.text(texto, marginX, y, {
        maxWidth: textWidth,
        align: "justify",
        lineHeightFactor: 1.7
      });

      // Data
      y += linhas.length * 12 * 1.7 * 0.352777 + 25;
      doc.text(`${todayBR()}.`, pageW - marginX, y, { align: "right" });

      // Assinatura
      y += 40;
      const sigStart = pageW / 2 - 45;
      const sigEnd = pageW / 2 + 45;
      doc.setDrawColor(115, 115, 115);
      doc.setLineWidth(0.4);
      doc.line(sigStart, y, sigEnd, y);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text("Assinatura da Direção", pageW / 2, y + 6, { align: "center" });
      doc.text(escola, pageW / 2, y + 11, { align: "center" });

      // Rodapé
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setDrawColor(232, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(marginX, footerY - 4, pageW - marginX, footerY - 4);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
        pageW / 2,
        footerY,
        { align: "center" },
      );

      const filename = `declaracao-matricula-${(nome || "aluno").toLowerCase().replace(/\s+/g, "-")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setGerando(false);
    }
  };

  const formValido = nome.trim() && nascimento && serie.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7f7] via-[#fffbf2] to-[#fffdf5]">
      <div className="mx-auto max-w-[1440px] w-full px-6 py-12">
        {/* Header */}
        <header className="mb-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md border border-red-100">
            <img src="/school_icon.png" alt="Logo Escola" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-950">Escola Paraíso da Criança</h1>
            <p className="text-sm font-semibold text-amber-800">
              Emissão de declarações de matrícula
            </p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.4fr] xl:grid-cols-[1fr_1.5fr] items-start">
          {/* Formulário */}
          <Card className="border-red-100 bg-white/90 shadow-xl shadow-red-900/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-950">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Dados do aluno(a)
              </CardTitle>
              <CardDescription>
                Preencha as informações abaixo para gerar a declaração em PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="escola" className="text-red-950">
                  Nome da escola
                </Label>
                <Input
                  id="escola"
                  value={escola}
                  onChange={(e) => setEscola(e.target.value)}
                  className="border-neutral-200 focus-visible:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-red-950">
                  Nome do aluno(a)
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex.: Maria Silva Santos"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="border-neutral-200 focus-visible:ring-red-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nascimento" className="text-red-950">
                    Data de nascimento
                  </Label>
                  <Input
                    id="nascimento"
                    type="date"
                    value={nascimento}
                    onChange={(e) => setNascimento(e.target.value)}
                    className="border-neutral-200 focus-visible:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serie" className="text-red-950">
                    Série
                  </Label>
                  <Input
                    id="serie"
                    placeholder="Ex.: 3º ano do Ensino Fundamental"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="border-neutral-200 focus-visible:ring-red-500"
                  />
                </div>
              </div>

              <Button
                onClick={gerarPDF}
                disabled={!formValido || gerando}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md shadow-red-600/10 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer font-semibold"
                size="lg"
              >
                <FileDown className="mr-2 h-5 w-5" />
                {gerando ? "Gerando declaração..." : "Gerar declaração em PDF"}
              </Button>
            </CardContent>
          </Card>

          {/* Prévia */}
          <div className="relative w-full max-w-[700px] lg:mx-auto">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-red-600/10 to-amber-500/10 blur-3xl opacity-80" />
            <div className="relative rounded-2xl border border-neutral-200 bg-white p-8 md:p-12 shadow-2xl shadow-neutral-200/50">
              <div className="mb-4 text-center text-[10px] font-bold uppercase tracking-widest text-amber-800">
                Prévia do documento
              </div>
              <div className="relative border-b-2 border-red-600 pb-4 flex items-center justify-between gap-4">
                {/* Espaçador oculto no desktop para equilibrar o título com a imagem na direita */}
                <div className="w-14 h-14 hidden sm:block pointer-events-none opacity-0" />
                
                <div className="text-center flex-1">
                  <h2 className="text-lg font-bold uppercase tracking-wide text-red-950">
                    {escola || "ESCOLA PARAÍSO DA CRIANÇA"}
                  </h2>
                  <p className="text-[11px] text-amber-850 font-semibold">
                    Educação Infantil e Ensino Fundamental
                  </p>
                </div>
                
                <img 
                  src="/school_icon.png" 
                  alt="Logo Escola" 
                  className="w-14 h-14 object-contain shrink-0" 
                />
              </div>

              <h3 className="mt-10 text-center text-lg font-bold uppercase tracking-wide text-red-950">
                Declaração de Matrícula
              </h3>

              <p className="mt-8 text-justify text-[13px] leading-7 text-neutral-800">
                Declaramos, para os devidos fins, que o(a) aluno(a){" "}
                <span className="font-semibold text-red-950">
                  {nome || "____________________"}
                </span>
                , nascido(a) em{" "}
                <span className="font-semibold text-red-950">
                  {formatDateBR(nascimento) || "__/__/____"}
                </span>
                , encontra-se regularmente matriculado(a) nesta instituição de ensino,
                cursando{" "}
                <span className="font-semibold text-red-950">
                  {serie || "____________________"}
                </span>{" "}
                no presente ano letivo.
              </p>

              <p className="mt-4 text-justify text-[13px] leading-7 text-neutral-800">
                Por ser expressão da verdade, firmamos a presente declaração.
              </p>

              <p className="mt-8 text-right text-[13px] text-neutral-800">{todayBR()}.</p>

              <div className="mt-16 flex flex-col items-center">
                <div className="h-px w-64 bg-neutral-400" />
                <p className="mt-2 text-[11px] text-neutral-500 font-medium">Assinatura da Direção</p>
                <p className="text-[11px] text-neutral-500">
                  {escola || "ESCOLA PARAÍSO DA CRIANÇA"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs font-semibold text-amber-850">
          Feito com carinho para nossa escola 🌱
        </footer>
      </div>
    </div>
  );
}
