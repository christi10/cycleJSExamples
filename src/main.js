import xs from 'xstream';
import {run} from '@cycle/run';
import {div, button, p, h1, h4, a, makeDOMDriver, input} from '@cycle/dom';
import {makeHTTPDriver, Response, HTTPSource} from '@cycle/http';

function main(sources) {
  // Increment and decrement actions
  const action$ = xs.merge(
    sources.DOM.select('.decrement')
      .events('click')
      .map(ev => -2),
    sources.DOM.select('.increment')
      .events('click')
      .map(ev => 1)
  );

  // Count stream
  const count$ = action$.fold((acc, x) => acc + x, 0);

  // DOM stream for the counter section
  const counterSection$ = count$.map(count =>
    div([
      button('.decrement', 'Decrement by two'),
      button('.increment', 'Increment'),
      p('Counter: ' + count),
    ])
  );

  // DOM stream for the checkbox section
  const checkboxSection$ = sources.DOM.select('input')
    .events('change')
    .map(ev => ev.target.checked)
    .startWith(false)
    .map(toggled =>
      div([
        input({attrs: {type: 'checkbox'}}),
        `Toggle me ${toggled ? 'Now is checked' : 'Right now is unchecked'}`,
        p(toggled ? 'ON' : 'OFF'),
      ])
    );

  // HTTP request stream
  const getRandomUser$ = sources.DOM.select('.get-random')
    .events('click')
    .map(() => {
      const randomNum = Math.round(Math.random() * 9) + 1;
      return {
        url: 'https://jsonplaceholder.typicode.com/users/' + String(randomNum),
        category: 'users',
        method: 'GET',
      };
    });

  // HTTP response stream
  const user$ = sources.HTTP.select('users')
    .flatten()
    .map(res => res.body)
    .startWith(null);

  // Combine both sections
  const vdom$ = xs
    .combine(counterSection$, checkboxSection$, user$)
    .map(([counter, checkbox, user]) => {
      console.log('eimai malakas');
      console.log(user);
      return div([
        counter,
        checkbox,
        div('.users', [
          button('.get-random', 'Get random user'),
          user === null
            ? null
            : div('.user-details', [
                h1('.user-name', user.name),
                h4('.user-email', user.email),
                a('.user-website', {attrs: {href: user.website}}, user.website),
              ]),
        ]),
      ]);
    });
  const sinks = {
    DOM: vdom$,
    HTTP: getRandomUser$,
  };

  return sinks;
}

run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver(),
});
