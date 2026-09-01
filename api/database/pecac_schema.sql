CREATE TABLE cidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE publicadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('prefeitura', 'empresa')),
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cidade_id INTEGER NOT NULL REFERENCES cidades(id),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE artistas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tempo_carreira VARCHAR(20) CHECK (tempo_carreira IN ('menos_2_anos', '2_a_5_anos', 'mais_5_anos')),
    curriculo TEXT,
    portfolio_url VARCHAR(255),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE artista_redes_sociais (
    id SERIAL PRIMARY KEY,
    artista_id INTEGER NOT NULL REFERENCES artistas(id) ON DELETE CASCADE,
    plataforma VARCHAR(20) NOT NULL CHECK (plataforma IN
        ('instagram', 'youtube', 'tiktok', 'spotify', 'facebook', 'whatsapp', 'outro')),
    url VARCHAR(255) NOT NULL,
    UNIQUE (artista_id, plataforma)
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE especialidades (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    nome VARCHAR(100) NOT NULL,
    UNIQUE (categoria_id, nome)
);

CREATE TABLE artista_especialidades (
    artista_id INTEGER NOT NULL REFERENCES artistas(id) ON DELETE CASCADE,
    especialidade_id INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    PRIMARY KEY (artista_id, especialidade_id)
);

CREATE TABLE artista_cidades (
    artista_id INTEGER NOT NULL REFERENCES artistas(id) ON DELETE CASCADE,
    cidade_id INTEGER NOT NULL REFERENCES cidades(id),
    PRIMARY KEY (artista_id, cidade_id)
);

CREATE TABLE editais (
    id SERIAL PRIMARY KEY,
    publicador_id INTEGER NOT NULL REFERENCES publicadores(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    especialidade_id INTEGER REFERENCES especialidades(id),
    cidade_id INTEGER NOT NULL REFERENCES cidades(id),
    descricao TEXT,
    premio VARCHAR(100),
    prazo_inscricao DATE NOT NULL,
    exige_documentos BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'encerrado')),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inscricoes (
    id SERIAL PRIMARY KEY,
    edital_id INTEGER NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
    artista_id INTEGER NOT NULL REFERENCES artistas(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'selecionado', 'nao_selecionado')),
    documentos_url VARCHAR(255),
    inscrito_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (edital_id, artista_id)
);

CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    artista_id INTEGER NOT NULL REFERENCES artistas(id) ON DELETE CASCADE,
    edital_id INTEGER REFERENCES editais(id) ON DELETE SET NULL,
    mensagem VARCHAR(255) NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO cidades (nome) VALUES
    ('Jundiaí'), ('Cabreúva'), ('Campo Limpo Paulista'),
    ('Itupeva'), ('Jarinu'), ('Louveira'), ('Várzea Paulista');

INSERT INTO categorias (nome) VALUES
    ('Música'), ('Dança'), ('Teatro'), ('Artes Visuais'), ('Literatura'), ('Audiovisual');

INSERT INTO especialidades (categoria_id, nome) VALUES
    ((SELECT id FROM categorias WHERE nome = 'Música'), 'Sertanejo'),
    ((SELECT id FROM categorias WHERE nome = 'Música'), 'MPB'),
    ((SELECT id FROM categorias WHERE nome = 'Música'), 'Jazz'),
    ((SELECT id FROM categorias WHERE nome = 'Música'), 'Rock'),
    ((SELECT id FROM categorias WHERE nome = 'Música'), 'Violão'),
    ((SELECT id FROM categorias WHERE nome = 'Dança'), 'Hip-Hop'),
    ((SELECT id FROM categorias WHERE nome = 'Dança'), 'Balé'),
    ((SELECT id FROM categorias WHERE nome = 'Teatro'), 'Comédia'),
    ((SELECT id FROM categorias WHERE nome = 'Teatro'), 'Drama'),
    ((SELECT id FROM categorias WHERE nome = 'Artes Visuais'), 'Pintura');