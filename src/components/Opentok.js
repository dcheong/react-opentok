import { PropTypes, Component } from 'react'
import ReactFauxDOM from 'react-faux-dom'
import _ from 'lodash'
import warning from 'warning'

const propTypes = {
  apiKey: PropTypes.number.isRequired,
  sessionId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  onArchiveStopped: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  videoId: PropTypes.string,
  audioId: PropTypes.string
}

class Opentok extends Component {
  constructor(props) {
    super(props)

    const session = OT.initSession(this.props.apiKey, this.props.sessionId)
    if (this.props.onArchiveStopped) {
      session.on('archiveStopped', () => {
        this.props.onArchiveStopped()
      }, this)
    }

    session.on('streamDestroyed', (event) => {
      if (event.stream.connection.connectionId === session.connection.connectionId) {
        event.preventDefault()
      }
    })

    const publisherElement = ReactFauxDOM.createElement('div')
    publisherElement.style.setProperty('margin', '0 auto')
    publisherElement.setAttribute('class', 'publisher')

    this.state = {
    session,
    publisherElement,
    submitted: []
    }
  }

  componentDidMount() {
    const { session, publisherElement } = this.state
    const self = this

    session.connect(this.props.token, (error) => {
      if (!error) {
        const { audioId, videoId, width, height } = self.props
        const publisher = OT.initPublisher(publisherElement.component, {
          audioSource: audioId,
          width,
          height,
          resolution: `${width}x${height}`,
          fitMode: 'contain',
          style: {
            audioLevelDisplayMode: 'off',
            archiveStatusDisplayMode: 'auto',
            buttonDisplayMode: 'off'
          },
          videoSource: videoId
        }, (initErr) => {
          warning(!initError, 'Error in OT.initPublisher')
        })
        session.publish(publisher, (publishErr) => {
          if (publishErr) {
            if (publishErr.code === 1500) {
              warning(false, 'Unable to publish stream')
            } else if (publishErr.code === 1601) {
              warning(false, 'Publish error')
            } else if (publishErr.code === 2001) {
              warning(false, 'Connection Failed')
            } else {
              warning(false, 'Error')
            }
            warning(false, 'Error in Session.publish')
          }
        })

        self.setState({
          session,
          publisherElement
        })
      } else {
        warning(error,
          `[${error.code}] There was an error connecting to the session:  ${error.message}`)
        if (error.code === 1006) {
          warning(false, 'Connection Failed')
        } else if (error.code === 2001) {
          warning(false, 'Servers are unresponsive')
        } else {
          warning(false, 'Error')
        }
        warning(false, 'Error')
      }
    })
  }

  componentWillUnmount() {
    if (this.state.session) {
      this.state.session.disconnect()
    }
  }

  render() {
    return this.state.publisherElement.toReact()
  }
}

Opentok.propTypes = propTypes

export default Opentok