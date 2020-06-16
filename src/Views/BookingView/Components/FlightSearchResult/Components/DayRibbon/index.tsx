import React from 'react';

import css from './DayRibbon.module.css';
import { AltOfferModel } from '../../../../../../Models/FlightModel';
import Utils from '../../../../../../Utils';

interface DayRibbonProps {
  className?: string;
  altOffers: AltOfferModel[];
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export default function DayRibbon({
  className,
  altOffers,
  selectedDate,
  onChange,
}: DayRibbonProps): JSX.Element {
  const classList = [css.DayRibbon];

  if (className) {
    classList.push(className);
  }

  return (
    <div className={classList.join(' ')}>
      <button type="button" className={css.NavigateBack}>
        Previous
      </button>
      {altOffers.map((altOffer, idx) => (
        <div
          className={css.Day}
          key={`day-${idx}`}
          aria-selected={Utils.compareDatesSimple(selectedDate, altOffer.departure)}
          role="option"
          onClick={(): void => onChange(altOffer.departure)}
        >
          <strong>
            {`${altOffer.total?.currency} ${Utils.formatCurrency(altOffer.total?.amount ?? 0)}`}
          </strong>
          <span>
            {altOffer.departure.toLocaleDateString(
              'en-US',
              { weekday: 'short', day: 'numeric', month: 'short' },
            )}
          </span>
        </div>
      ))}
      <button type="button" className={css.NavigateForward}>
        Next
      </button>
    </div>
  );
}