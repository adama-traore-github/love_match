package com.lovematch.websocket;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@ServerEndpoint("/chat")
public class MessageWebSocket {
    private static final Set<Session> sessions = Collections.synchronizedSet(new HashSet<>());

    @OnOpen
    public void onOpen(Session session) {
        System.out.println("Nouvelle connexion WebSocket: " + session.getId());
        sessions.add(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("Message reçu de " + session.getId() + ": " + message);
        
        // Diffuser le message à toutes les sessions connectées
        broadcast(message);
    }

    @OnClose
    public void onClose(Session session) {
        System.out.println("Déconnexion WebSocket: " + session.getId());
        sessions.remove(session);
    }

    @OnError
    public void onError(Throwable error) {
        System.err.println("Erreur WebSocket: " + error.getMessage());
        error.printStackTrace();
    }

    private static void broadcast(String message) {
        sessions.forEach(session -> {
            synchronized (session) {
                try {
                    session.getBasicRemote().sendText(message);
                } catch (IOException e) {
                    System.err.println("Erreur lors de l'envoi du message: " + e.getMessage());
                }
            }
        });
    }
}
