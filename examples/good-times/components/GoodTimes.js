import React from 'react';
import PropTypes from 'prop-types';

const GoodTimes = ({ list, pushItem, setRoll, roll }) => (
  <div className="good-times">
    <div style={{ marginBottom: 20, fontStyle: 'italic' }}>
      The state of your store(s) will be replicated to local storage so that it persists when you refresh.
    </div>

    <input
      type="button"
      style={{
        fontSize: '20px',
        marginBottom: '20px'
      }}
      value={`Let the good times ${roll}`}
      onClick={() => pushItem({
        time: Date.now()
      })}
      onContextMenu={event => {
        if (event) {
          event.preventDefault();
        }

        setRoll(window.prompt('Let the good times what?'));
      }}
    />

    <div style={{ marginBottom: 20 }}>
      Right clicked on button and entered "roll"?
      <b style={{ marginLeft: 10 }}>{roll === 'roll' ? 'Yes!' : 'No.'}</b>
    </div>

    {list.map(item => (
      <li key={item.time}>
        {new Date(item.time).toString()}
      </li>
    ))}
  </div>
);

GoodTimes.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  pushItem: PropTypes.func.isRequired,
  setRoll: PropTypes.func.isRequired,
  roll: PropTypes.any
};

export default GoodTimes;
