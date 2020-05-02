package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool) // connected clients
var broadcast = make(chan Message)
var gameClients = make(map[*websocket.Conn]bool)
var gameBroadcast = make(chan gameMessage)

var upgrader = websocket.Upgrader{}

type Message struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Message  string `json:"message"`
}

type gameMessage struct {
	Message    string `json:"message"`
	Type       string `json:"type"`
	PlayerX    string `json:"playerX"`
	Username   string `json:"username"`
	GameMaster bool   `json:"gameMaster"`
}

// this could be an array
type gamePlayers struct {
	playerA bool
	playerB bool
	playerC bool
	playerD bool
}

type player struct {
	name string
}

func main() {
	// Create a simple file server
	fs := http.FileServer(http.Dir("../public"))
	http.Handle("/", fs)

	players := gamePlayers{
		playerA: false,
		playerB: false,
		playerC: false,
		playerD: false,
	}
	http.HandleFunc("/ws-2", func(w http.ResponseWriter, r *http.Request) {
		if players.playerA && players.playerB && players.playerC && players.playerD {
			log.Printf("Game is full!")
		} else {
			if !players.playerA {
				players.playerA = true
				newPlayer := player{name: "player A"}
				handleConnectionsGame(w, r, &newPlayer, &players)
			} else if !players.playerB {
				players.playerB = true
				newPlayer := player{name: "player B"}
				handleConnectionsGame(w, r, &newPlayer, &players)
			} else if !players.playerC {
				players.playerC = true
				newPlayer := player{name: "player C"}
				handleConnectionsGame(w, r, &newPlayer, &players)
			} else {
				newPlayer := player{name: "player D"}
				handleConnectionsGame(w, r, &newPlayer, &players)
			}
		}
	})

	go handleGameMessages()

	http.HandleFunc("/ws", handleConnections)

	go handleMessages()

	log.Println("http server started on :8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleConnectionsGame(w http.ResponseWriter, r *http.Request, newPlayer *player, allPlayers *gamePlayers) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()
	gameClients[ws] = true
	/* Part B
	   1) announce player X has joined the game
	   2) if it's player A...game master
	   3) Front end should update the players at the table...if there's 4...start the game...
	   ******************************************************************************
	   4) Write a special message to the correct client that they are player X
	*/
	for {
		var msg gameMessage
		// Read in a new message as JSON and map it to a Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			log.Printf("somebody left the game probably....")
			delete(gameClients, ws)
			if (*newPlayer).name == "playerA" {
				(*allPlayers).playerA = false
			} else if (*newPlayer).name == "playerB" {
				(*allPlayers).playerB = false
			} else if (*newPlayer).name == "playerC" {
				(*allPlayers).playerC = false
			} else {
				(*allPlayers).playerD = false
			}
			/* Part C
			1) broadcast to everyone that player X left.
			2) front-end should send a notification, then users go back to waiting area...
			*/
			break
		} else {
			gameBroadcast <- msg
			/*
				**Part A
				1) pass message to the rest of the servers
				2) Front end creates a special message for game starting
				3) We check for that message...start shuffle and create deck...send
				******************************************************************************
				**Part A2
				1) Front end creates a special message for game starting
				2) We check for that message...start shuffle and create deck...send specific hand to each client
				3) Make this reusable so that they can create a new game.
				******************************************************************************
			*/
		}
	}
}

func handleGameMessages() {
	for {
		// Grab the next message from the broadcast channel
		msg := <-gameBroadcast
		// Send it out to every client that is currently connected
		for gameClient := range gameClients {
			err := gameClient.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				gameClient.Close()
				delete(gameClients, gameClient)
			}
		}
	}
}

// **********************************************************************************************************************************
// **********************************************************************************************************************************
// **********************************************************************************************************************************
// **********************************************************************************************************************************
// **********************************************************************************************************************************
// [OG CODE]
// **********************************************************************************************************************************
// **********************************************************************************************************************************
// **********************************************************************************************************************************
// **********************************************************************************************************************************

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()

	clients[ws] = true

	for {
		var msg Message
		// Read in a new message as JSON and map it to a Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}
		// Send the newly received message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		// Grab the next message from the broadcast channel
		msg := <-broadcast
		// Send it out to every client that is currently connected
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// go run main.go
