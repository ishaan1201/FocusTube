import { jsPDF } from "jspdf";

export const exportNotesToPDF = (notes, title) => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold").setTextColor(255, 0, 0).text("STUDY NOTES: " + title.toUpperCase(), 10, 20);
  doc.setFont("helvetica", "normal").setTextColor(0, 0, 0);
  const cleanNotes = notes.replace(/[^\x20-\x7E]/g, "");
  const splitText = doc.splitTextToSize(cleanNotes, 180);
  doc.text(splitText, 10, 40);
  doc.save(`${title}_Notes.pdf`);
};
