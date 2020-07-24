import React from 'react';

import css from './Hotel.module.css';
import { RoomOfferModel, HotelModel } from '../../../../../../Models/HotelOfferModel';
import DateUtils from '../../../../../../DateUtils';
import Utils from '../../../../../../Utils';

interface HotelProps {
  className?: string;
  hotel: HotelModel;
  checkIn: Date;
  checkOut: Date;
  occupants: number;
  roomOffer?: RoomOfferModel;
  onSelect: (roomOffer?: RoomOfferModel) => void;
  selected?: boolean;
}

export default class Hotel extends React.Component<HotelProps> {
  private asd(): void {
    //
  }

  render(): JSX.Element {
    const {
      className,
      selected,
      hotel,
      checkIn,
      checkOut,
      occupants,
      roomOffer,
      onSelect,
    } = this.props;

    const classList = [css.Hotel];

    if (className) {
      classList.push(className);
    }

    if (hotel.recommended) {
      classList.push(css.Recommended);
    }

    const nextRoomOffer = roomOffer ?? hotel.rooms[0].offers[0];
    const room = hotel.rooms.find(
      (nextRoom) => nextRoom.offers.findIndex((ro) => ro.hashCode === nextRoomOffer.hashCode),
    );

    const roomType = Utils.upperCaseFirst(room?.type.description.toLowerCase() ?? '');

    return (
      <div className={classList.join(' ')} aria-selected={selected}>
        <img src={hotel.images[0].thumb} alt={hotel.images[0].description} className={css.Image} />

        <div className={css.Info}>
          <div className={css.Details}>
            <h1>{hotel.name}</h1>

            <div className={css.Rating}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  className={rating <= hotel.rating ? css.Filled : undefined}
                  key={`rating-${rating}`}
                >
                  ★
                </span>
              ))}
            </div>

            <div className={css.CheckInCheckOut}>
              <span>{`Check-in: ${hotel.checkIn}`}</span>
              <span>{`Check-out: ${hotel.checkOut}`}</span>
            </div>
          </div>

          <div className={css.Pricing}>
            <strong>
              {`${nextRoomOffer.price.currency} ${
                Utils.formatCurrency(nextRoomOffer.price.total)
              }`}
            </strong>

            <span>
              {`${DateUtils.getDaysDelta(checkIn, checkOut)} nights, ${occupants} ${
                occupants === 1 ? 'guest' : 'guests'
              }`}
            </span>
          </div>

          <div className={css.RoomDetails}>
            <div className={css.RoomDescription}>
              <span>{roomType}</span>

              {selected && (
                <button type="button">
                  Change Room
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={(): void => onSelect(nextRoomOffer)}
              className={selected ? css.Selected : undefined}
            >
              {selected ? 'Deselect' : 'Select' }
            </button>
          </div>
        </div>
      </div>
    );
  }
}