var chai = require('chai'), chaiHttp = require('chai-http');
const { assert } = require('chai');
const roomModel = require("../../models/room")

chai.use(chaiHttp);

const app = 'http://localhost:4000'

const create_room_response = {
    gameState: "GAME_WAITING",
    currentRound: 0,
    players: [],
    startedTime: null
}
const num_rounds = 10

describe('Tests on Room Controller', function () {
    describe('POST /create_room', function () {
        it('should return a room object without any players', function () {
            chai.request(app)
                .post('/create_room')
                .then(function (res) {

                    assert.equal(res.status, 200)

                    room = res.body
                    assert.isNotNull(room['roomId'])
                    assert.propertyVal(room, 'gameState', create_room_response['gameState'])
                    assert.propertyVal(room, 'currentRound', create_room_response['currentRound'])
                    assert.deepPropertyVal(room, 'players', create_room_response['players'])
                    assert.propertyVal(room, 'startedTime', create_room_response['startedTime'])
                    assert.lengthOf(room.qna, num_rounds)
                })
                .catch(function (err) {
                    console.log(err)
                });
        })
    })

    describe('POST /join_room', function () {

        it('should allow player to join room', function () {

            var players = [{ playerName: 'uchiha sasuke', totalScore: 0, lastScore: 0 }]
            var room = new roomModel.Room()
            roomModel.saveRoom(room)
            chai.request(app)
                .post('/join_room')
                .type('form')
                .send({ nickname: 'uchiha sasuke', roomId: room['id'] })
                .then(function (res) {

                    assert.equal(res.status, 200)

                    room = res.body

                    assert.deepPropertyVal(room, 'players', players)
                })
                .catch(function (err) {
                    console.log(err)
                })

        })

        it('should prevent player with matching nicknames from joining the same game', function () {

            var players = [{ playerName: 'uzumaki naruto', totalScore: 0, lastScore: 0 }]
            var room = new roomModel.Room()
            room.addPlayer('naruto')
            roomModel.saveRoom(room)

            chai.request(app)
                .post('/join_room')
                .type('form')
                .send({ nickname: 'naruto', roomId: room['id'] })
                .then(function (res) {
                    assert.equal(res.status, 400)
                    assert.equal(res.text, 'Nickname already exists. Please choose another nickname!')
                })
                .catch(function (err) {
                    console.log(err)
                })
        })

        it('should prevent players from joining if game has already started', function () {
            var room2 = new roomModel.Room()
            room2.start()
            roomModel.saveRoom(room2)
            chai.request(app)
                .post('/join_room')
                .type('form')
                .send({ nickname: 'naruto', roomId: room2['id'] })
                .then(function (res) {
                    assert.equal(res.status, 400)
                    assert.equal(res.text, 'Game has started')
                })
                .catch(function (err) {
                    console.log(err)
                })
        })
    })

    describe('POST /start_game', function () {
        it('should change state of gameroom object', function () {
            var room = new roomModel.Room()
            roomModel.saveRoom(room)
            chai.request(app)
                .post('/start_game')
                .type('form')
                .send({ roomId: room['id'] })
                .then(function (res) {
                    assert.equal(res.status, 200)
                    assert.equal(res.body.gameState, 'ROUND_LOADING')
                })
                .catch(function (err) {
                    console.log(err)
                })
        })
    })

    describe('POST /submit_answer', function () {
        it('should update user score', function () {
            var nickname = 'pikachu'
            var score = 10
            var players = [{ playerName: 'pikachu', totalScore: 10, lastScore: 10 }]
            var room = new roomModel.Room()
            room.addPlayer(nickname)
            room.start()
            roomModel.saveRoom(room)
            chai.request(app)
                .post('/submit_answer')
                .type('form')
                .send({ roomId: room['id'], nickname: nickname, score: score })
                .then(function (res) {

                    assert.equal(res.status, 200)

                    var room = res.body
                    assert.deepPropertyVal(room, 'players', players)
                })
                .catch(function (err) {
                    console.log(err)
                })
        })

        it('should give error if score cannot be parsed to Integer', function () {
            var nickname = 'pikachu'
            var score = 'z10'
            var room = new roomModel.Room()
            room.addPlayer(nickname)
            room.start()
            roomModel.saveRoom(room)
            chai.request(app)
                .post('/submit_answer')
                .type('form')
                .send({ roomId: room['id'], nickname: nickname, score: score })
                .then(function (res) {
                    assert.equal(res.status, 400)
                    assert.equal(res.text, 'Score is not an integer')
                })
        })
    })
})
