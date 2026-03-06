# PECAC_V1
#### Desenvolvimento de Plataforma de Editais Culturais para Artistas e Contratantes 
**COLABORADORES** - _Robson Luiz da Conceição Júnior e Maria Cristina Lourencinho de Oliveira_ 

## 1. O Problema 

Artistas independentes (músicos, dançarinos, atores, etc.) enfrentam grande dificuldade para encontrar editais culturais abertos por prefeituras e empresas. Hoje, o processo é totalmente descentralizado: cada órgão publica seus editais em canais próprios como sites institucionais, perfis em redes sociais ou até grupos de WhatsApp. 

Isso obriga o artista a realizar um verdadeiro “garimpo digital” diário, monitorando múltiplos perfis e canais. Com isso, muitas oportunidades chegam ao conhecimento do artista já fora do prazo de inscrição, ou simplesmente nunca chegam. 

**Em resumo:** não existe hoje uma plataforma centralizada e oficial para a publicação e descoberta de editais culturais no Brasil. 

## 2. A Solução Proposta 

Desenvolver um software (combinação de aplicativo mobile + painel web) que funcione como a plataforma oficial de publicação e descoberta de editais culturais, beneficiando dois públicos distintos: 

### 2.1 Para os Artistas (App Mobile) 

O artista terá um perfil completo na plataforma contendo: 

- Informações pessoais e áreas de atuação (dança, música, teatro, etc.);
- Currículo e portfólio artístico já cadastrados;
- Vinculação com redes sociais profissionais;
- Definição de um raio geográfico (em km) para receber notificações de editais próximos.

Fluxo de inscrição simplificado: 

Quando um edital compatível com o perfil do artista for publicado, ele recebe uma notificação push no app. Ao abrir a notificação, basta clicar em “Quero me Inscrever”, as informações do perfil são enviadas automaticamente para o órgão responsável, sem necessidade de preencher formulários repetidamente.

### 2.2 Para Prefeituras e Empresas (Painel Web) 

Os órgãos responsáveis acessam um painel web para publicar e gerenciar seus editais. Ao publicar, configuram: 

- Área artística do edital (filtra os artistas compatíveis automaticamente);
- Localização e abrangência geográfica;
- Prazo de inscrição e documentação exigida;
- Opção de solicitar documentos extras além do perfil padrão, sendo esses específicos para sua seleção.

O órgão então recebe e visualiza diretamente na plataforma os perfis dos artistas inscritos, com acesso ao currículo, portfólio artístico e redes sociais de cada um. Caso o edital exija documentos adicionais específicos, o órgão responsável pode ativar uma seção de “Anexar Documentos”, mantendo o currículo e portfólio artístico sempre como base.

## 3. Justificativa da Arquitetura 

- _**App Mobile para artistas:**_ Notificações push são o canal ideal para alertar sobre novas oportunidades em tempo real, garantindo que o artista seja informado imediatamente ao surgir um edital compatível.

- _**Painel Web para publicadores:**_ Prefeituras e empresas geralmente operam em ambientes corporativos com computadores. Um painel web é mais adequado para o gerenciamento de formulários, uploads de documentos e visualização de candidaturas em tela grande. 

## 4. Público-Alvo 

- _**Artistas independentes:**_ Podendo ser de todas as áreas culturais que participam ou desejam participar de editais públicos e privados.
  
- _**Prefeituras e secretarias de cultura:**_ Instituições que regularmente publicam editais para contratação de serviços artísticos.
  
- _**Empresas privadas:**_ Instituições que patrocinam ou organizam eventos culturais e precisam contratar artistas. 


## 5. Diferenciais do Projeto 

- _**Centralização:**_ Único ponto de acesso para todos os editais culturais. 

- _**Personalização:**_ O artista recebe apenas editais compatíveis com sua área e localização. 

- _**Agilidade:**_ Inscrição com um clique, eliminando o retrabalho de preencher dados repetidamente. 

- _**Formalização:**_ Oferece um canal oficial às prefeituras e empresas, aumentando a legitimidade e o alcance dos editais. 

- _**Inclusão:**_ Artistas que não possuem grande presença digital ou acesso privilegiado a redes informais de informação passam a ter as mesmas oportunidades. 

## 6. Categorização de Artistas 

Para que os editais possam ser direcionados ao perfil certo de artista, a plataforma prevê um sistema de categorização baseado em dados declarados pelo próprio artista no momento do cadastro. Essa abordagem garante inclusão, simplicidade de implementação e respeito à diversidade do setor cultural. 

### 6.1 Por que não usar métricas de redes sociais? 

A ideia de categorizar artistas automaticamente pelo número de seguidores em redes sociais (Instagram, TikTok, YouTube, etc.) foi considerada, mas apresenta limitações relevantes:

- _**Disparidade entre áreas:**_ 10 mil seguidores têm pesos completamente diferentes para um músico indie e para um cantor pop. Não há um padrão universal aplicável;
- _**Restrições de API:**_ o acesso automatizado a dados de redes sociais é limitado pelas políticas das plataformas, tornando a integração complexa e instável para o escopo de um TCC;
- _**Métrica inadequada para o setor cultural:**_ um artista pode ter pouquíssimos seguidores nas redes e ainda assim ser um profissional consolidado, com anos de carreira e agenda cheia;

Por essas razões, a categorização por métricas externas foi descartada em favor de um modelo autodeclarado, mais simples, justo e viável tecnicamente.

### 6.2 Modelo de Categorização Viável  

No momento do cadastro, o artista preenche os seguintes campos de categorização, que ficam visíveis no perfil e servem como filtros na publicação de editais: 
- _**Tempo de carreira:**_ Menos de 2 anos / Entre 2 e 5 anos / Mais de 5 anos;
- _**Alcance geográfico da carreira:**_ Local / Regional / Nacional. 

Ao publicar um edital, prefeituras e empresas podem aplicar filtros por esses critérios. Por exemplo: uma prefeitura com programa de fomento a jovens talentos locais pode restringir o edital a artistas com menos de 2 anos de carreira e alcance local. Já uma empresa buscando um show de grande porte pode filtrar apenas profissionais com alcance regional ou nacional. 

Esse modelo coloca o artista no controle da própria identidade dentro da plataforma, sem depender de algoritmos externos, e permite que os publicadores encontrem exatamente o perfil que procuram. 

## 7. Panorama de Soluções Existentes 

Uma pesquisa sobre o mercado atual revela que, embora existam iniciativas relacionadas ao tema, nenhuma delas resolve o problema da forma proposta pela PECAC. As principais soluções encontradas são: 

- _**Mapa da Cultura (Ministério da Cultura):**_ Permite o cadastro de agentes culturais e lista editais do governo federal. No entanto, é restrito a editais federais. Não centraliza editais de prefeituras municipais nem de empresas privadas, e não conta com app mobile ou notificações push. 

- _**Editais e Afins:**_ Portal ativo desde 2015 que agrega editais de arte e cultura em um único lugar. Funciona como um blog/agregador, exigindo que o artista entre no site e busque manualmente as oportunidades. Não há perfil de artista, filtro por área de atuação nem inscrição simplificada. Além disso,  a publicação de edital mais recente é datada de 2022. 

- _**CAPAC (Prefeitura de São Paulo):**_ Sistema de credenciamento de artistas para agilizar contratações pela Secretaria de Cultura de São Paulo. É restrito ao município paulistano e serve exclusivamente para eventos da própria prefeitura, sem abertura para outros órgãos ou empresas. 

### 7.1 O que diferencia a PECAC: 

Nenhuma das soluções existentes combina os três elementos centrais da PECAC: 
- Perfil centralizado do artista com currículo e portfólio;
- Notificação proativa e personalizada por área de atuação e localização;
- Inscrição simplificada com um clique.

As alternativas atuais são portais passivos, o artista precisa correr atrás, ou sistemas internos de uma única instituição. 

A lacuna identificada é, portanto, real e não endereçada pelo mercado, o que reforça a relevância e a originalidade da proposta. 

## 8. Pontos em Aberto / Decisões Futuras 

- Definir tecnologias de desenvolvimento;
- Modelagem do banco de dados para perfis de artistas e editais;
- Estratégia de adoção: como convencer prefeituras a usar a plataforma como canal oficial;
- Moderação de editais: como validar que os publicadores são legítimos;
- Possibilidade de notificação por e-mail além do push notification.
