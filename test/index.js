var tape = require('tape')
var Hybrid = require('../')

//this uses a fixed bit width known in advance.
//in the parquet tests the default width is 3.

function Z (n) {
  var b = new Buffer(n)
  b.fill(0)
  return b
}

//run length only
tape('run-length only', function (t) {

  var hybrid = Hybrid(3)

  var input = []
  for(var i = 0; i < 100; i++)
    input.push(4)

  var expected = new Buffer([
    0xc8, 1, //varint 100 << 1
    4,
    0xff])

  var actual = hybrid.encode(input, Z(4))

  t.deepEqual(actual, expected)
  t.end()

// bitpacking only

})


//run length only
tape('run-length only', function (t) {

  var hybrid = Hybrid(3)

  var input = []
  for(var i = 0; i < 100; i++)
    input.push(4)
  for(var i = 0; i < 100; i++)
    input.push(5)

                           //0xc8 1 is varint(200)
  var expected = new Buffer([0xc8, 1, 4, 0xc8, 1, 5, 0xff])

  var actual = hybrid.encode(input, Z(7))

  t.deepEqual(actual, expected)
  t.end()

// bitpacking only

})

return

//some how it just magically decides whether to do bitpacking or RLE?
//oh, or probably it uses whatever is smaller!
//since it announces which one it does it can choose either.

tape('bit width zero', function (t) {

})

tape('bitpacking only', function (t) {
  //bit width is 3
  var input = []
  for(var i = 0; i < 100; i++)
    input.push(i % 3) // 0, 1, 2 ...

  // 104/8 << 1 = 27
  Buffer.concat([
    new Buffer([27]),
    bitpacking(null, input, 3),
    new Buffer([0xff])
  ])
})

tape('bit packing overflow', function (t) {
  var input = []
  for(var i = 0; i < 1000; i++)
    input.push(i%3)

  //comment from parquet-mr:
  // 504 is the max number of values in a bit packed run
  // that still has a header of 1 byte
  // header = ((504/8) << 1) | 1 = 127
  Buffer.concat([
    //obviously, the top bit means something.
    //0 on the top means it's not a repeating varint.
    //1 at the bottom means it's bitpacking.
    new Buffer([127]),
    bitpacking(null, input.slice(0, 504), 3),
    // there should now be 496 values in another bit-packed run
    // header = ((496/8) << 1) | 1 = 125
    new Buffer([125]),
    bitpacking(null, input.slice(504), 3),
    new Buffer([0xff])
  ])
})

tape('transition from bit packing to rle', function (t) {
  var input = [
    // 5 obviously bit-packed values
    0,1,0,1,0,
    // three repeated values, that ought to be bit-packed as well
    2, 2, 2
    //(because numbers always bitpacked in groups of 8!)
  ]
  for(var i = 0; i < 100; i++)
    input.push(2)

  Buffer.concat([
    // header = ((8/8) << 1) | 1 = 3
    new Buffer([3]),
    bitpacking(null, input.slice(0, 8), 3),
    varint.encode(200),
    new Buffer([
      2, // which was repeated 200 times
      0xff //end.
    ])
  ])
})

tape('padding zeros on unfinished bit packed runs', function (t) {
  //bit width 5
  var input = [], padding = []
  for(var i = 0; i < 9; i++)
    input.push(i+1)

  //these zeros are added because bitpacking always uses groups of 8.
  for(var i = 0; i < 7; i++)
    padding.push(0)

  // header = ((16/8) << 1) | 1 = 5
  Buffer.concat([
    new Buffer([5]),
    bitpacking(null, input.concat(padding), 5),
    new Buffer([0xff])
  ])
})

tape('test switching modes', function (t) {
  //width 9
  var input = []

  //rle first

  for (var i = 0; i < 25; i++)
    input.push(17)

  //why does it decide to bitpack now?
  for (var i = 0; i < 7; i++)
    input.push(7)

  input.push(8)
  input.push(9)
  input.push(10)

  for (var i = 0; i < 25; i++)
    input.push(6)

  for (var i = 0; i < 8; i++)
    input.push(5)

  Buffer.concat([
    // header = 25 << 1 = 50
    new Buffer([
      50, // 25<<1 as a varint
      // 17 as two byte little endian.
      // (the value repeated 25 times)
      17, 0,
      // 16 bit packed valueseee
      // 16/8 << 1 | 1 = 5
      5, //a varint.
    ]),
    bitpacking(null, inputs.slice(25, 25+16), 9),
    // start a RLE block
    // header = 19 << 1 = 38
    new Buffer([
      38,
      6, 0, //two byte little endian.
      // header = 8 << 1  = 16
      16,
      5, 0, //two byte little endian.
      0xff
    ])
  ])
})




