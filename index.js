const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

const book = require('./lib/book')

app.use(cors())

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

/**
 * @api {get} /remaining Get Remaining Seat(s)
 * @apiName GetRemaining
 * @apiGroup Tickets
 * @apiDescription This endpoint should return a list of available seats in the current round
 * 
 * @apiSuccess {String[]} seats List of seat no. (Up to 10 seats)
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "seats": [
 *        "A1",
 *        "A2",
 *        ...
 *      ]
 *    }
 */
app.get('/remaining', function(req, res) {
    const result = book.getRemaining()
    res.json({ seats: result })
})

/**
 * @api {post} /book Book the Seat
 * @apiGroup Tickets
 * @apiDescription This endpoint required seat no. and will return the ticket if it available, otherwise will return false
 * 
 * Rule:
 * 1. No duplicate tickets (same round, same seat) can be given to any clients
 * 2. All seats in the current round has to be given out first before next round can be open.
 * 3. Seats can be given out in any order that still respect rule (2).
 * 
 * @apiParam {String} seat The seat no. that user want to reserve.
 * 
 * @apiSuccess {Boolean} success Status of seat reservation
 * @apiSuccess {Number} round Round number for this ticket
 * @apiSuccess {String} seat Seat for this ticket
 * @apiSuccess {Number} reserve_expired_time Reservation expired time in timestamp
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "success": true,
 *      "round": 1,
 *      "seat": "A1",
 *      "reserve_expired_time": 1527009296459
 *    }
 * @apiErrorExample {json} Error
 *    HTTP/1.1 403 Forbidden
 *    {
 *      "success": false,
 *    }
 */
app.post('/book', function(req, res) {
    const result = book.reserve(req.body.seat)
    if (result.success) {
        res.json(result)
    } else {
        res.status(403).json(result)
    }
})

/**
 * @api {post} /confirm Confirm Ticket
 * @apiGroup Tickets
 * @apiDescription This endpoint should be called after /book within period of time to confirm booking
 * 
 * @apiParam {String} seat The seat no. to confirm
 * 
 * @apiSuccess {Boolean} success Status of seat confirmation
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "success": true
 *    }
 * 
 */
app.post('/confirm', function(req, res) {
    const result = book.confirm(req.body.seat)
    if (result) {
        res.json({ success: result })
    } else {
        res.status(403).json({ success: result })
    }
})

/**
 * @api {post} /cancel Cancel Ticket
 * @apiGroup Tickets
 * @apiDescription This endpoint could be called to cancel any confirmed or reserved ticket in the current round and then another user can have that seat
 * 
 * @apiParam {String} seat The seat no. to cancel
 * 
 * @apiSuccess {Boolean} success Status of seat cancellation
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "success": true
 *    }
 * 
 */
app.post('/cancel', function(req, res) {
    const result = book.cancel(req.body.seat)
    if (result) {
        res.json({ success: result })
    } else {
        res.status(403).json({ success: result })
    }
})

/**
 * @api {get} /bookings Get all booked tickets
 * @apiGroup Tickets
 * @apiDescription This endpoint will be called only one time at the end mainly for validation.
 * 
 * It does not have to be performant nor concurrent safe, but this should be 
 * representative of all confirmed tickets booked from all the client
 * 
 * @apiSuccess {Object[]} bookings              List of all bookings groupped by round
 * @apiSuccess {Number}   bookings.round        Round number
 * @apiSuccess {String[]} bookings.seats        Seats in current round
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [
 *      { "round": 1, "seats": ["A2","A3","A4"] }
 *      { "round": 2, "seats": ["A2","A3","A4"] }
 *    ]
 */
app.get('/bookings', function(req, res) {  
    res.send(book.getBookings())
})

app.use("/apidoc", express.static("public/apidoc"))

book.init()

app.listen(3000, function() {  
    console.log('API Running...')
})