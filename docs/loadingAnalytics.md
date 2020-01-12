### Bootstrapping

The host app must include an iframe which source `src` is a url to the deployed analytics app.
To avoid CORS issues please deploy analytics to the same domain as the host app.

In order to load analytics app correctly the host app needs to provide a valid configuration 
to the analytics app via iframe post message mechanism.

First of all the host app must register to the message event using `window.addEventListener('message', handlerFn)`.

Then implement `analyticsInit` event handler (`event.data.messageType === 'analyticsInit'`,
all events will be listed below and you can find a complete example at `dev/analyticsLoader.html`).
With this event, the host app receives the menu config and the views config objects
that may be used as a starting point to modify the menu or components visibility on pages of the analytics app.  

In the response to `analyticsInit` event the host app must send `init` event
to the analytics app with the payload containing the app configuration mentioned above 
(`iframeDomNode.contentWindow.postMessage({ messageType: 'init', payload: configurationObject }, window.location.origin)`).

Once configuration of the analytics app is done (on the analytics app side) the host app will receive `analyticsInitComplete` event without payload
meaning the app was initialized correctly. In response to this event the host app has to send 2 events back to analytics:
1) `navigate` – to notify which page show by default, the list of available pages can be found [here](https://github.com/kaltura/analytics-front-end/blob/master/src/app/app.component.ts#L103).
2) `updateFilters` – to set a default date filter or entry id, the list of available filter names and value can be found [here](https://github.com/kaltura/analytics-front-end/blob/master/src/app/shared/components/date-filter/date-filter.service.ts#L8-L26).
For example: `{ queryParams: { dateBy: 'last30days' } }`.
In case of entry pages the host app must provide `{ queryParams: { id: '[realEntryId]' } }` param.

Otherwise check a dev-tools console for errors.

To prevent issue with 2 scrolls on the page the host app should implement `updateLayout` event handler,
which receives the real height of the analytics apps (units: px) to update iframe height inside the host app.

### Configuration
The structure of the config required by analytics app:

```
appId: string, // the host application ID, for example 'kmc', 'kms' etc.
kalturaServer: {
  uri: string, // link to the kaltura server, www.kaltura.com is the default one
  previewUIConf: string, // UIConf of the player
},
cdnServers: string, // link to the cdn server
liveAnalytics?: { // configuration of the legacy live analytics app, is displayed in case "permissions.enableLiveViews" is false
  uri: string,
  uiConfId?: string,
  mapUrls?: string[],
  mapZoomLevels?: string,
},
ks: string, // partner's ks
pid: number, // partner id
multiAccount: boolean, // notifies the analytics app that current session is running under multi-accont mode, all report types will be switched to ones that support multiaccount
contrastTheme: boolean, // toggle contrast theme (currently supported in the entry drill-down only)
locale: string, // locale code, currently only "en" translation is supported by analytics app
dateFormat?: 'month-day-year' | 'day-month-year', // style of date format, currently support only "mdy" and "dmy" formats
live?: { // configuration of the live module
  pollInterval: 10 | 30 | 60 | 300, // how often the poll requests will be sent to the server
  healthNotificationsCount: number, // default is 50, amount of notifications that are displayed to user at once
},
menuConfig?: {
  showMenu: boolean, // display internal menu
  items?: {
    id: string,
    link: string, // link to the page inside the analytics app, please use https://github.com/kaltura/analytics-front-end/blob/kms/src/app/app-menu/app-menu.component.ts#L23-L78 links only!
    label: string,
    items?: {
      id: string,
      link: string, // link to the page inside the analytics app, please use https://github.com/kaltura/analytics-front-end/blob/kms/src/app/app-menu/app-menu.component.ts#L23-L78 links only!
      label: string,
    }[], // optional array of sub items, has the same structure as item itself, only one level of nesting is supported
  }[],
},
viewsConfig?: {
  [key: string]: Object | boolean // the list of all view configs keys available is available here https://github.com/kaltura/analytics-front-end/blob/master/src/app/shared/services/app.service.ts#L15
},
customData?: { // the place to pass host app specific data to analytics
  [key: string]: any,
},
```

### Events

The events are grouped by a direction that they can be used:
- **H ← A** (from analytics to host)
- **H → A** (from host to analytics) 
- **H ⇆ A** (can be send by both host and analytics):

Event type | Event name | Payload | Description
-----------|------------|---------|------------|
H ← A | `analyticsInit` | `{ menuConfig: [shape described above], viewsConfig: [shape described above] }` | Initial event from the analytics app, that tells the host app that it's ready to bootstrap
H → A | `init` | `{ config: [shape described above] }` | Init event send from host to analytics app, passing the configuration object
H ← A | `analyticsInitComplete` | none | Final event for initial phase, notifies the host app that initialization was completed
H ← A | `logout`| none | Notify the host app to logout, might be useful in case of expired ks, since the analytics app doesn't handle authentication has to be handled by the host app
H ← A | `updateLayout` | `{ height: number }` | Each time the analytics app changes its height it fires this event in order the host app to be able to update the frame height to prevent cutting of the content, the payload is the analytics app height in px 
H ← A | `scrollTo` | `number` | There're a few places in the analytics app where a scroll to logic is implemented (audience / engagement: highlights to table, for instance) and since the host app is in control over the analytics app height it has to manage scrolling features like this as well
H ← A | `modalOpened` | none | Since the analytics app might not cover the full height of the host page, once a modal popup is opened inside the analytics app (confirmation dialog, categories filter popup, etc.) the host app should cover its UI elements outside of the frame with a blackdrop to make UI feel consistent  
H ← A | `modalClosed` | none | In opposite to `modalOpened` event notifies the host app to clean up any changes after a modal was closed (remove blackdrop for example)
H ← A | `navigateTo` | `string` | In case the custom navigation is implemented by the host app it has to handle all external navigation that happens. Currently there're navigation to:<br/> - entry drill-down page<br/> - live entry drill-down page<br/> - external entry page  
H ← A | `entryNavigateBack` | none | In case direct drill-down from the host app happens handle this event to properly navigate back to it
H → A | `setLogsLevel` | `{ level: LogLevels }` | The analytics app implements logging and supports different type of levels, possible values are: 'All', 'Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal', 'Off'
H → A | `updateFilters` | `{ queryParams: { [key: string]: string } }` | Date filters in the analytics app are preserved via queryParams which allows to deep-link to required time range from the url, in case the host app handles all navigation it has to send the queryParams with required filters, otherwise the default one will be used
H → A | `updateMultiAccount` | `{ multiAccount: boolean }` | Notifies the analytics app about switching the multi-account mode, reloads the page after update
H → A | `updateConfig` | `{ config: [shape described above] }` | Allows to update the analytics config after the app's been initialized
H → A | `toggleContrastTheme` | none | Toggle the contrast theme of the analytics app. Adds/removes the class from the analytics app body element.
H ⇆ A | `navigate` | A listens for: `{ url: string, queryParams: { [key: string]: string } }`<br/>A sends: `{ [key: string]: string }` | In case the navigation is handled by the host app, the analytics app is listening for a url from the host app which which is mapped for according route inside the analytics. Upon a navigation event inside the analytics app it will send an event with updated queryParams to the host app which will should be updated and then send back via `updateFilters` event
H → A | `setLanguage` | `string` | Change the Analytics application language according to the provided locale string. Supported locale values: 'de', 'en', 'es', 'fr', 'ja', 'nl', 'pt_br', 'ru', 'zh_hans', 'zh_hant'

### Example

To see analytics in action follow the steps:

1. Make sure all dependencies are installed, otherwise run `npm install`
2. Get valid KS and partner id
3. Go to `src/dev/analyticsLoader.html` and copy them into the config (lines [37](https://github.com/kaltura/analytics-front-end/tree/master/src/dev/analyticsLoader.html#L37) and [38](https://github.com/kaltura/analytics-front-end/tree/master/src/dev/analyticsLoader.html#L38) accordingly as strings)
4. Run `npm run example` (or `npm run example:menu`, or `npm run example:view`)
5. Wait until build is completed
6. Go to your browser and open `http://localhost:4201`

**DO NOT COMMIT ANYTHING WHILE THE EXAMPLE SCRIPT IS RUNNING**

There're 2 more examples: menu and view.
The menu example shows how to configure the internal analytics menu from the host app.
The view example shows hot to configure the analytics views and components from the host app.

To run those example use `npm run example:menu` and `npm run example:view` commands accordingly.  

##### Troubleshooting

Make sure the ports `4200` and `4201` are available, make sure the KS and partner id are valid and not expired.  
