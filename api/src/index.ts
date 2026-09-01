import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Rota de teste - confirma que a API está no ar
app.get("/", (req, res) => {
  res.json({ status: "API do PECAC funcionando!" });
});

// Lista todas as especialidades cadastradas, com a categoria de cada uma
app.get("/especialidades", async (req, res) => {
  const especialidades = await prisma.especialidades.findMany({
    include: { categorias: true },
  });
  res.json(especialidades);
});

// Cadastra um novo artista
app.post("/artistas", async (req, res) => {
  try {
    const { nome, email, senha, tempo_carreira, curriculo, portfolio_url, redes_sociais } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);

    const artista = await prisma.artistas.create({
      data: {
        nome,
        email,
        senha_hash,
        tempo_carreira,
        curriculo,
        portfolio_url,
        artista_redes_sociais: {
          create: redes_sociais || [], // ex: [{ plataforma: "instagram", url: "..." }]
        },
      },
      include: { artista_redes_sociais: true },
    });

    res.status(201).json(artista);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível cadastrar o artista", detalhes: error });
  }
});

// Cadastra um novo publicador (prefeitura ou empresa)
app.post("/publicadores", async (req, res) => {
  try {
    const { nome, tipo, email, senha, cidade_id } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);

    const publicador = await prisma.publicadores.create({
      data: {
        nome,
        tipo,
        email,
        senha_hash,
        cidade_id,
      },
    });

    res.status(201).json(publicador);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível cadastrar o publicador", detalhes: error });
  }
});

// Publica um novo edital
app.post("/editais", async (req, res) => {
  try {
    const {
      publicador_id,
      titulo,
      categoria_id,
      especialidade_id,
      cidade_id,
      descricao,
      premio,
      prazo_inscricao,
      exige_documentos,
    } = req.body;

    const edital = await prisma.editais.create({
      data: {
        publicador_id,
        titulo,
        categoria_id,
        especialidade_id,
        cidade_id,
        descricao,
        premio,
        prazo_inscricao: new Date(prazo_inscricao),
        exige_documentos: exige_documentos ?? false,
      },
    });

    res.status(201).json(edital);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível publicar o edital", detalhes: error });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});