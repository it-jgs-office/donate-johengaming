import Pusher from 'pusher-js'

let pusherClient = null

export function getPusherClient() {
  const key = import.meta.env.VITE_PUSHER_APP_KEY

  if (!key) return null

  if (!pusherClient) {
    pusherClient = new Pusher(key, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
      forceTLS: true,
    })
  }

  return pusherClient
}

export function subscribeToCreatorEvent(username, eventName, handler, options = {}) {
  const client = getPusherClient()

  if (!client || !username) return () => {}

  const channel = client.subscribe(`creator.${username.toLowerCase()}`)
  const handleSubscribed = () => options.onSubscribed?.()

  channel.bind(eventName, handler)
  channel.bind('pusher:subscription_succeeded', handleSubscribed)

  if (channel.subscribed) {
    queueMicrotask(handleSubscribed)
  }

  return () => {
    channel.unbind(eventName, handler)
    channel.unbind('pusher:subscription_succeeded', handleSubscribed)
  }
}

export function subscribeToCreatorDonations(username, handler, options = {}) {
  return subscribeToCreatorEvent(username, 'donation.paid', handler, options)
}

export function subscribeToAdminData(handler, options = {}) {
  const client = getPusherClient()

  if (!client) return () => {}

  const channel = client.subscribe('admin.dashboard')
  const handleSubscribed = () => options.onSubscribed?.()

  channel.bind('admin.data.updated', handler)
  channel.bind('pusher:subscription_succeeded', handleSubscribed)

  if (channel.subscribed) {
    queueMicrotask(handleSubscribed)
  }

  return () => {
    channel.unbind('admin.data.updated', handler)
    channel.unbind('pusher:subscription_succeeded', handleSubscribed)
  }
}
