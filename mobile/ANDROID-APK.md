# APK de teste

O workflow Android test APK usa somente runner padrão no repositório público, sem EAS, loja ou plano pago. Se o repositório se tornar privado, o job não executa automaticamente. O artefato é retido por um dia, sem cache adicional de Gradle.

`expo prebuild` gera Android a partir de app.json; não editar os arquivos gerados. `assembleRelease` inclui o bundle JavaScript no APK e usa a chave pública de desenvolvimento do template Expo/RN: é uma versão de teste, não assinatura privada para publicação. O identificador inicial é `com.lumeproductions.lumefit`, versão 0.1.0, código 1. Para distribuir uma versão de produção, definir e guardar uma chave própria antes da publicação.

O APK é independente de Expo Go, QR, Metro e computador. A interface hospedada continua dependendo de internet, conforme WEB-PARITY.md. O armazenamento da instalação é separado do Expo Go/Chrome; não há importação automática dos registros locais anteriores. A conta existente pode ser acessada pela interface normal.

O build verifica assinatura, identificador, manifest sem debuggable, presença do bundle e SHA-256. Instalação, inicialização, fotos e backup no aparelho real continuam exigindo teste; compilação não comprova esses fluxos.
