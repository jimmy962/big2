# Big 2
This is an implementation of the Chinese poker game Big 2 for desktop browsers.

![alt text](https://github.com/jimmy962/big2/blob/master/game.png?raw=true)

## Development
```
cd ./main.go
go run main.go
```


## Production
```
docker run -it --publish 8000:8000 jelly55/big2_main:version3
```

## Notes
- Game allows for 1 table of 4 players
- Game can start only when all 4 players are at the table
- Start game by typing "start" in the input next to the suit button
- Only player 1 can start new hands


## Motivation
My friends and I were looking for a platform to play the game during the pandemic but couldn't find a desktop version with the same rules we played with. 