package com.sac.service;

import com.sac.model.Note;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExportService {

    // Predefined order for the structured exam answer
    private final List<String> CATEGORY_ORDER = List.of(
            "Definition", "Explanation", "Example", "Diagram", "Flowchart",
            "Important Point", "Advantages", "Disadvantages", "Conclusion"
    );

    public byte[] exportToPdf(List<Note> notes) throws Exception {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        
        document.open();
        
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLUE);
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.DARK_GRAY);
        Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.BLACK);
        
        Paragraph title = new Paragraph("Smart Answer Collector - Structured Exam Notes", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);
        
        Map<String, List<Note>> groupedNotes = structureNotes(notes);
        
        for (String category : CATEGORY_ORDER) {
            if (groupedNotes.containsKey(category) && !groupedNotes.get(category).isEmpty()) {
                Paragraph sectionTitle = new Paragraph(category, sectionFont);
                sectionTitle.setSpacingBefore(15);
                sectionTitle.setSpacingAfter(10);
                document.add(sectionTitle);
                
                for (Note note : groupedNotes.get(category)) {
                    Paragraph noteContent = new Paragraph("• " + note.getContent(), textFont);
                    noteContent.setSpacingAfter(5);
                    document.add(noteContent);
                }
            }
        }
        
        document.close();
        return out.toByteArray();
    }

    public byte[] exportToDocx(List<Note> notes) throws Exception {
        XWPFDocument document = new XWPFDocument();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        XWPFParagraph title = document.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = title.createRun();
        titleRun.setText("Smart Answer Collector - Structured Exam Notes");
        titleRun.setColor("0000FF");
        titleRun.setBold(true);
        titleRun.setFontSize(18);
        titleRun.addBreak();
        titleRun.addBreak();
        
        Map<String, List<Note>> groupedNotes = structureNotes(notes);
        
        for (String category : CATEGORY_ORDER) {
            if (groupedNotes.containsKey(category) && !groupedNotes.get(category).isEmpty()) {
                XWPFParagraph section = document.createParagraph();
                XWPFRun sectionRun = section.createRun();
                sectionRun.setText(category);
                sectionRun.setBold(true);
                sectionRun.setFontSize(14);
                
                for (Note note : groupedNotes.get(category)) {
                    XWPFParagraph content = document.createParagraph();
                    XWPFRun contentRun = content.createRun();
                    contentRun.setText("• " + note.getContent());
                    contentRun.setFontSize(12);
                }
            }
        }
        
        document.write(out);
        document.close();
        return out.toByteArray();
    }
    
    public Map<String, List<Note>> structureNotes(List<Note> notes) {
        return notes.stream().collect(Collectors.groupingBy(Note::getCategory));
    }
}
