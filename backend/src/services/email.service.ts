/**
 * Serviço de Email com Brevo
 * Gerencia envio de emails (recuperação de senha, notificações, etc)
 */

import config from "../config/index.js";

interface EmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  sender?: {
    name: string;
    email: string;
  };
}

interface BrevoResponse {
  messageId?: string;
  message?: string;
  code?: string;
  errors?: Array<{
    message: string;
  }>;
}

class EmailService {
  private apiKey: string;
  private apiUrl = "https://api.brevo.com/v3/smtp/email";
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || "";
    this.senderEmail =
      process.env.BREVO_SENDER_EMAIL || "";
    this.senderName = process.env.BREVO_SENDER_NAME || "";

    if (!this.apiKey) {
      console.warn(
        "⚠️ BREVO_API_KEY não configurada - emails não serão enviados",
      );
    }
  }

  /**
   * Enviar email de recuperação de senha
   */
  async sendPasswordResetEmail(
    email: string,
    nome: string,
    resetToken: string,
    resetLink: string,
  ): Promise<boolean> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
              .code-box { display: block; background: #fff; padding: 20px; border-left: 4px solid #e91e63; margin: 20px 0; text-align: center; }
              .code { font-size: 32px; font-weight: bold; color: #e91e63; letter-spacing: 5px; font-family: 'Courier New', monospace; }
              .footer { font-size: 12px; color: #999; text-align: center; padding-top: 20px; border-top: 1px solid #eee; }
              .warning { color: #d32f2f; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📚 Caderneta</h1>
                <p>Recuperação de Senha</p>
              </div>
              
              <div class="content">
                <p>Olá <strong>${nome}</strong>,</p>
                
                <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo para continuar:</p>
                
                <div class="code-box">
                  <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">Código de Verificação</p>
                  <div class="code">${resetToken}</div>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 14px;">Copie e cole este código no aplicativo</p>
                
                <p class="warning">⚠️ Este código expira em 1 hora. Se não solicitou esta recuperação, ignore este email.</p>
              </div>
              
              <div class="footer">
                <p>© 2026 Caderneta - Sistema de Fiado Digitalizado</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      return await this.send({
        to: email,
        toName: nome,
        subject: "Código de recuperação de senha - Caderneta",
        htmlContent,
      });
    } catch (error) {
      console.error("Erro ao enviar email de recuperação:", error);
      return false;
    }
  }

  /**
   * Enviar email de confirmação de nova senha
   */
  async sendPasswordChangedEmail(
    email: string,
    nome: string,
  ): Promise<boolean> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
              .success { color: #e91e63; font-weight: bold; }
              .footer { font-size: 12px; color: #999; text-align: center; padding-top: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📚 Caderneta</h1>
                <p>Senha Alterada com Sucesso</p>
              </div>
              
              <div class="content">
                <p>Olá <strong>${nome}</strong>,</p>
                
                <p>Sua senha foi <span class="success">alterada com sucesso</span>!</p>
                
                <p>Se não foi você quem fez essa alteração, entre em contato conosco imediatamente.</p>
              </div>
              
              <div class="footer">
                <p>© 2026 Caderneta - Sistema de Fiado Digitalizado</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      return await this.send({
        to: email,
        toName: nome,
        subject: "Sua senha foi alterada - Caderneta",
        htmlContent,
      });
    } catch (error) {
      console.error("Erro ao enviar email de confirmação:", error);
      return false;
    }
  }

  /**
   * Método privado para enviar email via Brevo
   */
  private async send(params: EmailParams): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn("⚠️ Brevo API key não configurada");
        return false;
      }

      const payload = {
        sender: params.sender || {
          name: this.senderName,
          email: this.senderEmail,
        },
        to: [
          {
            email: params.to,
            name: params.toName || params.to,
          },
        ],
        subject: params.subject,
        htmlContent: params.htmlContent,
      };

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as BrevoResponse;
        console.error(
          "Erro ao enviar email:",
          errorData.message || `HTTP ${response.status}`,
        );
        return false;
      }

      const data = (await response.json()) as BrevoResponse;

      if (data.messageId) {
        console.log(`📧 Email enviado com sucesso: ${params.to}`);
        return true;
      }

      console.error("Erro ao enviar email:", data.message);
      return false;
    } catch (error: any) {
      console.error("Erro na requisição Brevo:", error.message);
      return false;
    }
  }
}

export default new EmailService();
