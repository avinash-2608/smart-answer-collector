package com.sac.controller;

import com.sac.model.Note;
import com.sac.service.ExportService;
import com.sac.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notes")
@CrossOrigin(origins = "*") // For development purposes to allow Chrome extension
public class NoteController {

    @Autowired
    private NoteService noteService;

    @Autowired
    private ExportService exportService;

    @PostMapping("/save")
    public ResponseEntity<Note> saveNote(@RequestBody Note note) {
        return new ResponseEntity<>(noteService.saveNote(note), HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Note>> getAllNotes() {
        return new ResponseEntity<>(noteService.getAllNotes(), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearAllNotes() {
        noteService.clearAllNotes();
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/structure")
    public ResponseEntity<Map<String, List<Note>>> getStructuredNotes() {
        List<Note> allNotes = noteService.getAllNotes();
        return new ResponseEntity<>(exportService.structureNotes(allNotes), HttpStatus.OK);
    }

    @PostMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() {
        try {
            List<Note> allNotes = noteService.getAllNotes();
            byte[] pdfBytes = exportService.exportToPdf(allNotes);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "exam_notes.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/export/docx")
    public ResponseEntity<byte[]> exportDocx() {
        try {
            List<Note> allNotes = noteService.getAllNotes();
            byte[] docxBytes = exportService.exportToDocx(allNotes);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
            headers.setContentDispositionFormData("attachment", "exam_notes.docx");
            
            return new ResponseEntity<>(docxBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
