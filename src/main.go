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
type gamePlayersName struct {
	playerA string
	playerB string
	playerC string
	playerD string
}

type Player struct {
	name     string // used to identify player #
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

	var gameTable [4]*Player

	http.HandleFunc("/wsxyz", func(w http.ResponseWriter, r *http.Request) {
		if gameTable[0] == nil {
			gameTable[0] = &Player{name: "playerA"}
			handleConnectionsGame(w, r, 0, &gameTable)
		} else if gameTable[1] == nil {
			gameTable[1] = &Player{name: "playerB"}
			handleConnectionsGame(w, r, 1, &gameTable)
		} else if gameTable[2] == nil {
			gameTable[2] = &Player{name: "playerC"}
			handleConnectionsGame(w, r, 2, &gameTable)
		} else if gameTable[3] == nil {
			gameTable[3] = &Player{name: "playerD"}
			handleConnectionsGame(w, r, 3, &gameTable)
		} else {
			log.Printf("Game is full!")
		}
	})

	go handleGameMessages(&gameTable)

	// For the chat
	http.HandleFunc("/ws", handleConnections)
	go handleMessages()

	log.Println("http server started on :8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleConnectionsGame(w http.ResponseWriter, r *http.Request, index int, gameTable *[4]*Player) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	player := *gameTable[index]
	defer ws.Close()
	gameClients[ws] = true
	for {
		var msg gameMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			log.Printf(player.username + " disconnected...")
			(*gameTable)[index] = nil
			delete(gameClients, ws)
			//	TODO: Notify client that the player left
			break
		} else {
			if msg.Type == "new_player" {
				player.username = msg.Username
				msg.PlayerX = player.name
				msg.GameMaster = index == 0
			} else if msg.Type == "new_game" {
				if (*gameTable)[0] != nil && (*gameTable)[1] != nil && (*gameTable)[2] != nil && (*gameTable)[3] != nil {
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

func combineUsernames(playerNames *gamePlayersName, gameTable *[4]*Player) string {
	var usernames = ""
	if (*playerNames).playerA != "" && (*gameTable)[0] != nil {
		usernames = usernames + "A:" + (*playerNames).playerA
	}
	if (*playerNames).playerB != "" && (*gameTable)[1] != nil {
		usernames = usernames + "," + "B:" + (*playerNames).playerB
	}
	if (*playerNames).playerC != "" && (*gameTable)[2] != nil {
		usernames = usernames + "," + "C:" + (*playerNames).playerC
	}
	if (*playerNames).playerD != "" && (*gameTable)[3] != nil {
		usernames = usernames + "," + "D:" + (*playerNames).playerD
	}
	return usernames
}

func handleGameMessages(gameTable *[4]*Player) {
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
			msg.Message = combineUsernames(&playerNames, gameTable)
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
