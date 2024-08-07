import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebase';
import FightForecast from './FightForecast';
import TopFiveForecast from './TopFiveForecast';
import './Voting.css';

function Voting() {
  const [fights, setFights] = useState([]);
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    const fightsRef = ref(database, 'fights');
    const unsubscribe = onValue(fightsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFights(Object.values(data));
      }
    });

    const savedUserVotes = localStorage.getItem('userVotes');
    if (savedUserVotes) {
      setUserVotes(JSON.parse(savedUserVotes));
    }

    return () => unsubscribe();
  }, []);

  const handleVote = (fightId, fighter) => {
    if (userVotes[fightId]) {
      alert('Ya has votado en este combate.');
      return;
    }

    const fightRef = ref(database, `fights/${fightId}`);
    update(fightRef, {
      [`votes/${fighter}`]: fights.find(f => f.id === fightId).votes[fighter] + 1
    });

    const updatedUserVotes = { ...userVotes, [fightId]: fighter };
    setUserVotes(updatedUserVotes);
    localStorage.setItem('userVotes', JSON.stringify(updatedUserVotes));
  };

  const getImageFileName = (fighter, size) => {
    const baseName = fighter.toLowerCase().replace(' y ', '-').replace(' ', '-');
    return `${baseName}-${size}.webp`;
  };

  const renderFighterButton = (fightId, fighterKey, votes, size) => {
    const fight = fights.find(f => f.id === fightId);
    const fighterName = fight.type === 'multiple' ? fighterKey : fight[fighterKey];
    return (
      <motion.button 
        onClick={() => handleVote(fightId, fighterKey)}
        disabled={userVotes[fightId]}
        className={`${userVotes[fightId] === fighterKey ? 'voted' : ''} ${size}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img src={`${process.env.PUBLIC_URL}/images/${getImageFileName(fighterName, size)}`} alt={fighterName} />
        <span>{fighterName}</span>
        <span>({votes} votos)</span>
      </motion.button>
    );
  };

  return (
    <motion.div 
      className="voting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Votaciones para los Combates</h2>
      {fights.map((fight, index) => (
        <motion.div 
          key={fight.id} 
          className="fight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <h3>Combate {fight.id}</h3>
          {fight.type === 'multiple' ? (
            <div className="multiple-fighters">
              <h4>{fight.title}</h4>
              {fight.fighters.map(fighter => (
                <div key={fighter} className="fighter-button">
                  {renderFighterButton(fight.id, fighter, fight.votes[fighter] || 0, fight.size)}
                </div>
              ))}
              <TopFiveForecast fighters={fight.fighters} votes={fight.votes} />
            </div>
          ) : (
            <div className="fighters">
              {renderFighterButton(fight.id, 'fighter1', fight.votes.fighter1, fight.size)}
              <span>VS</span>
              {renderFighterButton(fight.id, 'fighter2', fight.votes.fighter2, fight.size)}
              <FightForecast
                fighter1={fight.fighter1}
                fighter2={fight.fighter2}
                votes={fight.votes}
              />
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default Voting;