import extend      from './utils/extend';
import getOriginXY from './utils/getOriginXY';
import defaults    from './defaultOptions';
import Signals     from './utils/Signals';

const signals = new Signals();

class InteractEvent {
  /** */
  constructor (interaction, event, action, phase, element, related, preEnd = false) {
    element = element || interaction.element;

    const target      = interaction.target;
    const deltaSource = (target && target.options || defaults).deltaSource;
    const origin      = getOriginXY(target, element, action);
    const starting    = phase === 'start';
    const ending      = phase === 'end';
    const prevEvent   = starting? this : interaction.prevEvent;
    const coords      = starting
      ? interaction.startCoords
      : ending
        ? { page: prevEvent.page, client: prevEvent.client, timeStamp: interaction.curCoords.timeStamp }
        : interaction.curCoords;

    this.page      = extend({}, coords.page);
    this.client    = extend({}, coords.client);
    this.timeStamp = coords.timeStamp;

    if (!ending) {
      this.page.x -= origin.x;
      this.page.y -= origin.y;

      this.client.x -= origin.x;
      this.client.y -= origin.y;
    }

    this.ctrlKey       = event.ctrlKey;
    this.altKey        = event.altKey;
    this.shiftKey      = event.shiftKey;
    this.metaKey       = event.metaKey;
    this.button        = event.button;
    this.buttons       = event.buttons;
    this.target        = element;
    this.currentTarget = element;
    this.relatedTarget = related || null;
    this.preEnd        = preEnd;
    this.type          = action + (phase || '');
    this.interaction   = interaction;
    this.interactable  = target;

    this.t0 = starting ? interaction.downTimes[interaction.downTimes.length - 1]
                       : prevEvent.t0;

    this.x0       = interaction.startCoords.page.x - origin.x;
    this.y0       = interaction.startCoords.page.y - origin.y;
    this.clientX0 = interaction.startCoords.client.x - origin.x;
    this.clientY0 = interaction.startCoords.client.y - origin.y;

    if (starting || ending) {
      this.dx = 0;
      this.dy = 0;
    }
    else if (deltaSource === 'client') {
      this.dx = this.client.x - prevEvent.client.x;
      this.dy = this.client.y - prevEvent.client.y;
    }
    else {
      this.dx = this.page.x - prevEvent.page.x;
      this.dy = this.page.y - prevEvent.page.y;
    }

    this.dt        = interaction.pointerDelta.timeStamp;
    this.duration  = this.timeStamp - this.t0;

    // speed and velocity in pixels per second
    this.speed = interaction.pointerDelta[deltaSource].speed;
    this.velocity = {
      x: interaction.pointerDelta[deltaSource].vx,
      y: interaction.pointerDelta[deltaSource].vy,
    };

    this.swipe = (ending || phase === 'inertiastart')? this.getSwipe() : null;

    signals.fire('new', {
      interaction,
      event,
      action,
      phase,
      element,
      related,
      starting,
      ending,
      deltaSource,
      iEvent: this,
    });
  }

  get pageX () { return this.page.x; }
  get pageY () { return this.page.y; }
  set pageX (value) { this.page.x = value; }
  set pageY (value) { this.page.y = value; }

  get clientX () { return this.client.x; }
  get clientY () { return this.client.y; }
  set clientX (value) { this.client.x = value; }
  set clientY (value) { this.client.y = value; }

  get velocityX () { return this.velocity.x; }
  get velocityY () { return this.velocity.y; }
  set velocityX (value) { this.velocity.x = value; }
  set velocityY (value) { this.velocity.y = value; }

  getSwipe () {
    const interaction = this.interaction;

    if (interaction.prevEvent.speed < 600
        || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
      return null;
    }

    let angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
    const overlap = 22.5;

    if (angle < 0) {
      angle += 360;
    }

    const left = 135 - overlap <= angle && angle < 225 + overlap;
    const up   = 225 - overlap <= angle && angle < 315 + overlap;

    const right = !left && (315 - overlap <= angle || angle <  45 + overlap);
    const down  = !up   &&   45 - overlap <= angle && angle < 135 + overlap;

    return {
      up,
      down,
      left,
      right,
      angle,
      speed: interaction.prevEvent.speed,
      velocity: {
        x: interaction.prevEvent.velocityX,
        y: interaction.prevEvent.velocityY,
      },
    };
  }

  preventDefault () {}

  /** */
  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }

  /** */
  stopPropagation () {
    this.propagationStopped = true;
  }
}

InteractEvent.signals = signals;

export default InteractEvent;
