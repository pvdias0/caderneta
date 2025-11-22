const fs = require("fs");
const path = require("path");

const resetProject = () => {
  const filesToDelete = [
    "node_modules",
    "package-lock.json",
    "yarn.lock",
    ".expo",
    "dist",
    "build",
  ];

  const projectRoot = path.join(__dirname, "..");

  console.log("🔄 Resetando projeto...\n");

  filesToDelete.forEach((file) => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      try {
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`✅ Deletado diretório: ${file}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`✅ Deletado arquivo: ${file}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao deletar ${file}:`, error.message);
      }
    }
  });

  console.log("\n✅ Reset concluído!");
  console.log('📝 Execute "npm install" para reinstalar as dependências.');
};

resetProject();
