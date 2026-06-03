import { Injectable } from '@angular/core';
import { Medicine } from '../models/medicine';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private apiKey = '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';
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  async recomendarMedicamento(sintomas: string, inventario: Medicine[]): Promise<string> {
    try {
      // filtrar medicmaentos de stock activo
      const disponibles = (inventario || []).filter(m => m && m.stock > 0);

      if (disponibles.length === 0) {
        return "No hay stock disponible en este momento.";
      }

      //  Extraemos solo lo necesario y recortamos descripciones
      // Esto evita enviar miles de caracteres innecesarios y previene el Error 429
      const inventarioComprimido = disponibles.map(m => ({
        nombre: m.name,
        sirve_para: (m.description || '').substring(0, 80), 
        stock: m.stock
      }));

      //   el prompt enviando el JSON ultra ligero
      const prompt = `
        Sintomas del cliente: "${sintomas}".
        Inventario disponible: ${JSON.stringify(inventarioComprimido)}

        Instruccion: Encuentra qué medicamento sirve para el síntoma de forma lógica.
        Responde en una sola linea corta indicando el nombre exacto del medicamento y las unidades en stock.
        Si nada de la lista sirve para ese malestar o dolor especifico, responde exactamente: "No hay stock para ese malestar.".
      `;

      // HTTP a Groq
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.2 // para que sea mas estricto y lijero

        })
      });

      // Manejo inteligente de respuestas de error de la API
      if (!response.ok) {
        if (response.status === 429) {
          return "El asistente gratuito está recibiendo muchas consultas. Por favor, espera 5 segundos y vuelve a intentar.";
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('Error detallado de la API:', errorData);
        throw new Error(`Error en la API: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Error con la IA:', error);
      return 'Lo siento, el asistente de IA no está disponible en este momento. Por favor, busca manualmente.';
    }
  }
}