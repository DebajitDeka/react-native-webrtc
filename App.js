import React, { Component } from 'react';
import {StyleSheet, Text, TouchableHighlight, View, ListView, Image, TextInput} from 'react-native';
import {RTCView} from 'react-native-webrtc';


import {Dimensions} from 'react-native';
import styles from './style/fullScreenVideo.js';
const window = Dimensions.get('window');

const win = {
  screenWidth: window.width,
  screenHeight: window.height,
  thumbnailHeight: 100,
  useRCTView: true, //debug or not?
  video: {
    minWidth: 500,
    minHeight: 300,
    minFrameRate: 30,
  },
};

const FRONT_CAMERA = true;
const webRTCServices = require("./lib/services.js");
const VIDEO_CONFERENCE_ROOM = "video_conference";

const SELF_STREAM_ID = "self_stream_id";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeStreamId: null,
      //streamURLs: sampleStreamURLs,
      streams: [], //list of (id, url: friend Stream URL). Id = socketId
      joinState: "ready", //joining, joined
      name: "Tho Q Luong"
    }
  }


  componentDidMount() {
    webRTCServices.getLocalStream(true, (stream) => {
      this.setState({
        activeStreamId: SELF_STREAM_ID,
        streams: [{
          id: SELF_STREAM_ID,
          url: stream.toURL()
        }]
      })
    });
  }

  render() {
    let activeStreamResult = this.state.streams.filter(stream => stream.id == this.state.activeStreamId);
    return <View style={styles.container}>
      <View style={styles.backgroundOverlay} />
      <View style={styles.container}>
     
        <RTCView streamURL={activeStreamResult.length > 0 ? activeStreamResult[0].url : null} style={styles.video} />
       
    </View>
    {this.renderJoinContainer()}

    </View>
  }

  renderJoinContainer() {
    if(this.state.joinState != "joined") {
      return <View style={styles.joinContainer}>
        <Text style={styles.joinLabel}>Be the first to join this conversation</Text>
        <TextInput style={styles.joinName}
          placeholder={"Enter your name"} placeholderTextColor={"#888"}
          onChangeText={(name) => this.setState({name})}
          value={this.state.name} />
        <TouchableHighlight style={styles.joinButton}
            onPress={this.handleJoinClick.bind(this)}>
          <Text style={styles.joinButtonText}>{this.state.joinState == "ready" ? "Join" : "Joining..."}</Text>
        </TouchableHighlight>
      </View>
    }
    return null;
  }
  handleSetActive(streamId) {
    this.setState({
      activeStreamId: streamId
    });
  }
  handleJoinClick() {
    if(this.state.name.length == 0 || this.state.joinState != "ready") {
      return;
    }
    //ELSE:
    this.setState({
      joinState: "joining"
    });
    let callbacks = {
      joined: this.handleJoined.bind(this),
      friendConnected: this.handleFriendConnected.bind(this),
      friendLeft: this.handleFriendLeft.bind(this),
      dataChannelMessage: this.handleDataChannelMessage.bind(this)
    }
    webRTCServices.join(VIDEO_CONFERENCE_ROOM, this.state.name, callbacks);
  }
  handleJoined() {
    console.log("Joined");
    this.setState({
      joinState: "joined"
    });
  }

  handleFriendLeft(socketId) {
    let newState = {
      streams: this.state.streams.filter(stream => stream.id != socketId)
    }
    if(this.state.activeStreamId == socketId) {
      newState.activeStreamId = newState.streams[0].id;
    }
    this.setState(newState);
  }

  handleFriendConnected(socketId, stream) {
    this.setState({
      streams: [
        ...this.state.streams,
        {
          id: socketId,
          url: stream.toURL()
        }
      ]
    })
  }
  handleDataChannelMessage(message) {

  }

  }

