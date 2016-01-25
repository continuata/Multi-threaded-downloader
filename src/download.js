/**
 * Created by tushar.mathur on 20/01/16.
 */

'use strict'
const _ = require('lodash')
const createStore = require('reactive-storage').create
const u = require('./utils')
const Rx = require('rx')

exports.download = function (ob, fileDescriptor) {
  var writeAt = 0
  const writtenAt = createStore(0)
  const contentLength = fileDescriptor.flatMap(x => ob.fsStat(x)).pluck('size').map(x => x - 512)
  const metaBuffer = Rx.Observable.just(u.createEmptyBuffer(512))
  const createMETA = Rx.Observable.combineLatest(contentLength, fileDescriptor, metaBuffer, u.selectAs('offset', 'fd', 'buffer'))
    .flatMap(ob.fsReadBuffer)
    .map(x => JSON.parse(x[1].toString()))
  const requestStream = createMETA.flatMap(ob.requestBody)
  const bufferStream = requestStream.filter(x => x.event === 'data').pluck('message')
  const downloadMETA = fileDescriptor
    .combineLatest(bufferStream, u.selectAs('fd', 'buffer'))
    .map(buffer => _.assign({}, buffer, {offset: writeAt}))
    .tap(x => writeAt += x.buffer.length)
    .flatMap(ob.fsWriteBuffer).map(x => x[0])
    .tap(x => writtenAt.set(o => o + x))
    .tapOnCompleted(() => writtenAt.end())
    .combineLatest(writtenAt.getStream(), (a, b) => b)
    .distinctUntilChanged()
    .withLatestFrom(createMETA, u.selectAs('bytesSaved', 'meta'))
    .map(x => _.assign({}, x.meta, {bytesSaved: x.bytesSaved}))

  return downloadMETA
    .withLatestFrom(fileDescriptor, contentLength, u.selectAs('json', 'fd', 'offset'))
    .flatMap(ob.fsWriteJSON)
    .withLatestFrom(createMETA, writtenAt.getStream(), (a, b, c) => _.assign({}, b, {bytesSaved: c}))
}
