package main

import (
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

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

type gamePlayers struct {
	playerA bool
	playerB bool
	playerC bool
	playerD bool
}

type gamePlayersName struct {
	playerA string
	playerB string
	playerC string
	playerD string
}

type player struct {
	name     string
	username string
}

func dealHands() ([]string, []string, []string, []string) {
	ranks := [13]string{"K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"}
	suits := [4]string{"hearts", "spades", "diams", "clubs"}
	var deck []string
	for _, rank := range ranks {
		for _, suit := range suits {
			deck = append(deck, suit+"-"+rank)
		}
	}
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(52, func(i, j int) { deck[i], deck[j] = deck[j], deck[i] })
	return deck[0:13], deck[13:26], deck[26:39], deck[39:52]
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

	var gameTable [4]*player

	http.HandleFunc("/wsxyz", func(w http.ResponseWriter, r *http.Request) {
		if players.playerA && players.playerB && players.playerC && players.playerD {
			log.Printf("Game is full!")
		} else {
			if !players.playerA {
				players.playerA = true
				gameTable[0] = &player{name: "playerA"}
				handleConnectionsGame(w, r, gameTable[0], &players)
			} else if !players.playerB {
				players.playerB = true
				gameTable[1] = &player{name: "playerB"}
				handleConnectionsGame(w, r, gameTable[1], &players)
			} else if !players.playerC {
				players.playerC = true
				gameTable[2] = &player{name: "playerC"}
				handleConnectionsGame(w, r, gameTable[2], &players)
			} else {
				players.playerD = true
				gameTable[3] = &player{name: "playerD"}
				handleConnectionsGame(w, r, gameTable[3], &players)
			}
		}
	})

	go handleGameMessages(&players)

	http.HandleFunc("/ws", handleConnections)

	go handleMessages()

	log.Println("http server started on :8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleConnectionsGame(w http.ResponseWriter, r *http.Request, newPlayer *player, allPlayers *gamePlayers) {
	// TODO in the morning...stop using allPlayers...use the new map
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// newPlayer :=
	defer ws.Close()
	gameClients[ws] = true
	for {
		var msg gameMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			log.Printf((*newPlayer).username + " disconnected...")
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
			/*
				TODO: Notify client that a player has left
			*/
			break
		} else {
			if msg.Type == "new_player" {
				(*newPlayer).username = msg.Username
				msg.PlayerX = (*newPlayer).name
				msg.GameMaster = msg.PlayerX == "playerA"
			} else if msg.Type == "new_game" {
				if (*allPlayers).playerA && (*allPlayers).playerB && (*allPlayers).playerC && (*allPlayers).playerD {
					playerAHand, playerBHand, playerCHand, playerDHand := dealHands()
					gameBroadcast <- gameMessage{PlayerX: "playerA", Message: strings.Join(playerAHand, ","), Type: "new_game"}
					gameBroadcast <- gameMessage{PlayerX: "playerB", Message: strings.Join(playerBHand, ","), Type: "new_game"}
					gameBroadcast <- gameMessage{PlayerX: "playerC", Message: strings.Join(playerCHand, ","), Type: "new_game"}
					gameBroadcast <- gameMessage{PlayerX: "playerD", Message: strings.Join(playerDHand, ","), Type: "new_game"}
				}
				continue
			}
			gameBroadcast <- msg
		}
	}
}

func combineUsernames(playerNames *gamePlayersName, statuses *gamePlayers) string {
	var usernames = ""
	if (*playerNames).playerA != "" && (*statuses).playerA {
		usernames = usernames + "A:" + (*playerNames).playerA
	}
	if (*playerNames).playerB != "" && (*statuses).playerB {
		usernames = usernames + "," + "B:" + (*playerNames).playerB
	}
	if (*playerNames).playerC != "" && (*statuses).playerC {
		usernames = usernames + "," + "C:" + (*playerNames).playerC
	}
	if (*playerNames).playerD != "" && (*statuses).playerD {
		usernames = usernames + "," + "D:" + (*playerNames).playerD
	}
	return usernames
}

func handleGameMessages(statuses *gamePlayers) {
	playerNames := gamePlayersName{}
	for {
		// Grab the next message from the broadcast channel
		msg := <-gameBroadcast
		if msg.Type == "new_player" {
			switch msg.PlayerX {
			case "playerA":
				playerNames.playerA = msg.Username
			case "playerB":
				playerNames.playerB = msg.Username
			case "playerC":
				playerNames.playerC = msg.Username
			case "playerD":
				playerNames.playerD = msg.Username
			}
			msg.Message = combineUsernames(&playerNames, statuses)
		}
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
