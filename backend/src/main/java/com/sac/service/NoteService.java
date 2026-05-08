package com.sac.service;

import com.sac.model.Note;
import com.sac.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    public Note saveNote(Note note) {
        // Smart Categorization Logic if category is not provided or empty
        if (note.getCategory() == null || note.getCategory().isEmpty()) {
            note.setCategory(smartCategorize(note.getContent()));
        }
        return noteRepository.save(note);
    }

    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    public void deleteNote(Long id) {
        noteRepository.deleteById(id);
    }

    public void clearAllNotes() {
        noteRepository.deleteAll();
    }

    private String smartCategorize(String content) {
        String lowerContent = content.toLowerCase();
        if (lowerContent.contains("defined as") || lowerContent.contains("definition")) {
            return "Definition";
        } else if (lowerContent.contains("advantage") || lowerContent.contains("benefit")) {
            return "Advantages";
        } else if (lowerContent.contains("disadvantage") || lowerContent.contains("drawback")) {
            return "Disadvantages";
        } else if (lowerContent.contains("example") || lowerContent.contains("for instance")) {
            return "Example";
        } else if (lowerContent.contains("conclusion") || lowerContent.contains("to sum up")) {
            return "Conclusion";
        }
        return "Explanation";
    }
}
