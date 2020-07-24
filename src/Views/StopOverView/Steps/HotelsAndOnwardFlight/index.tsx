import React from 'react';

import css from './HotelsAndOnwardFlight.module.css';
import spinner from '../../../../Assets/Images/spinner.svg';
import ContentService from '../../../../Services/ContentService';
import StopOverService from '../../../../Services/StopOverService';
import { HotelOfferModel, RoomOfferModel, getHotelRoomOfferChain } from '../../../../Models/HotelOfferModel';
import { FlightOfferModel, FareModel, LegModel } from '../../../../Models/FlightOfferModel';
import AppState from '../../../../AppState';
import { StopOverModel } from '../../../../Models/StopOverModel';
import { TripModel } from '../../../../Models/TripModel';
import Hotels from './Hotels';
import OnwardFlights from './OnwardFlights';

interface HotelsAndOnwardFlightProps {
  originalFare: FareModel;
  contentService: ContentService;
  stopOverService: StopOverService;
  onSelectOnward: (fare?: FareModel) => void;
  onSelectRoom: (room?: RoomOfferModel) => void;
  stopOverInfo?: StopOverModel;
  onwardFare?: FareModel;
  hotelRoom?: RoomOfferModel;
}

interface HotelsAndOnwardFlightState {
  days?: number;
  trip?: TripModel;
  flightOffers?: FlightOfferModel[];
  hotelOffers?: HotelOfferModel;
  stopOver?: StopOverModel;
  otherOptionsExpanded: boolean;
}

export default class HotelsAndOnwardFlight extends React.Component<
  HotelsAndOnwardFlightProps,
  HotelsAndOnwardFlightState
> {
  private readonly otherOptionsRef = React.createRef<HTMLButtonElement>();

  private pendingStopOverReq?: Promise<{
    flightOffers: FlightOfferModel[][];
    hotelOffers: HotelOfferModel;
  } | undefined>

  constructor(props: HotelsAndOnwardFlightProps) {
    super(props);

    this.state = {
      trip: AppState.tripSearch,
      days: AppState.stopOverDays,
      flightOffers: undefined,
      hotelOffers: undefined,
      stopOver: AppState.stopOverInfo,
      otherOptionsExpanded: false,
    };

    this.clickOutside = this.clickOutside.bind(this);
  }

  componentDidMount(): void {
    const { days, stopOver } = this.state;

    const nextDays = days ?? stopOver?.days[0] ?? 0;

    this.getOffers(nextDays);

    document.addEventListener('click', this.clickOutside);
    document.addEventListener('focusin', this.clickOutside);
  }

  componentWillUnmount(): void {
    this.pendingStopOverReq = undefined;
    document.removeEventListener('click', this.clickOutside);
    document.removeEventListener('focusin', this.clickOutside);
  }

  private async getOffers(days: number): Promise<void> {
    const { days: prevDays } = this.state;

    AppState.stopOverDays = days;

    await new Promise(
      (resolve) => this.setState(
        { days, flightOffers: undefined, hotelOffers: undefined },
        resolve,
      ),
    );

    const {
      stopOverService,
      originalFare,
      onwardFare,
      hotelRoom,
      onSelectOnward,
      onSelectRoom,
    } = this.props;
    const { trip } = this.state;

    if (prevDays !== days) {
      onSelectOnward(undefined);
      onSelectRoom(undefined);
    }

    const startLeg = trip?.legs[0];
    const endLeg = trip?.legs[(trip?.legs.length ?? 1) - 1];

    let flightOffers;
    let hotelOffers;

    if (startLeg?.departure && endLeg?.departure && days) {
      const pendingOfferReq = stopOverService.getOffers(
        originalFare.hashCode,
        'AUH',
        days,
        startLeg.departure,
        endLeg.departure,
      );
      this.pendingStopOverReq = pendingOfferReq;

      const resp = await pendingOfferReq;

      if (pendingOfferReq !== this.pendingStopOverReq) {
        // New request was triggered.
        return;
      }

      if (resp) {
        flightOffers = resp.flightOffers;
        hotelOffers = resp.hotelOffers;
      }
    }

    if (flightOffers && flightOffers[0]) {
      flightOffers[0].sort((a, b) => {
        const aStartLeg = a.legs.find((leg) => leg.origin.code === 'AUH') as LegModel;
        const bStartLeg = b.legs[b.legs.length - 1];

        if (aStartLeg.departure < bStartLeg.departure) {
          return -1;
        }

        if (aStartLeg.departure > bStartLeg.departure) {
          return 1;
        }

        return 0;
      });

      if (!onwardFare || flightOffers[0].findIndex(
        (fo) => fo.fares[0].hashCode === onwardFare.hashCode,
      ) === -1) {
        onSelectOnward(flightOffers[0][0].fares[0]);
      }

      if (!hotelRoom) {
        onSelectRoom(getHotelRoomOfferChain(hotelOffers?.hotels, hotelRoom)[2]);
      }
    }

    this.setState({
      flightOffers: (flightOffers && flightOffers[0]) ?? [],
      hotelOffers: hotelOffers ?? { checkIn: new Date(), checkOut: new Date(), hotels: [] },
    });
  }

  private clickOutside(e: any): void {
    const { otherOptionsExpanded } = this.state;

    if (
      !otherOptionsExpanded
      || !this.otherOptionsRef.current
      || this.otherOptionsRef.current.contains(e.target)
    ) {
      return;
    }

    this.setState({ otherOptionsExpanded: false });
  }

  render(): JSX.Element {
    const {
      contentService,
      originalFare,
      onSelectOnward,
      onSelectRoom,
      onwardFare,
      hotelRoom,
    } = this.props;

    const {
      flightOffers,
      hotelOffers,
      stopOver,
      days,
      otherOptionsExpanded,
      trip,
    } = this.state;

    const passengers = trip?.passengers || { adults: 1, children: 0, infants: 0 };
    const occupants = passengers.adults + passengers.children + passengers.infants;
    const nextStopOverDays = (stopOver?.days ?? []).slice(0, 3);

    return (
      <div className={css.HotelsAndOnwardFlight}>
        <div className={css.Header}>
          <h1>Select the number of Abu Dhabi stopover nights, then choose your onward flight.</h1>
          <h2>I want to stopover for:</h2>

          <div className={css.DayOptions}>
            {nextStopOverDays.sort().map((day) => (
              <button
                key={`stopover-day-${day}`}
                className={css.DayButton}
                type="button"
                aria-selected={day === days}
                disabled={day === days}
                role="option"
                onClick={(): Promise<void> => this.getOffers(day)}
              >
                {`${day} Nights`}
              </button>
            ))}

            <button
              className={[css.DayButton, css.OtherOptions].join(' ')}
              type="button"
              onClick={(): void => this.setState({ otherOptionsExpanded: !otherOptionsExpanded })}
              ref={this.otherOptionsRef}
              role="option"
              aria-selected={stopOver?.days.indexOf(days ?? 0) === -1}
            >
              Other Options

              <div
                className={css.OtherDayOptions}
                aria-expanded={otherOptionsExpanded}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    className={css.OtherDayButton}
                    role="option"
                    key={`optional-day-${day}`}
                    aria-selected={day === days}
                    onClick={(): Promise<void> => this.getOffers(day)}
                  >
                    <span />
                    <strong>{`${day} Nights`}</strong>
                    <em
                      style={{ visibility: day === (stopOver?.days[0] ?? 0)
                        ? undefined
                        : 'hidden',
                      }}
                    >
                      Recommended
                    </em>
                  </div>
                ))}
              </div>
            </button>
          </div>
        </div>

        {!(flightOffers && hotelOffers)
          ? (
            <strong className={css.Searching}>
              <img src={spinner} alt="Searching" />
              Loading hotels and onward flights
            </strong>
          )
          : (
            <div className={css.Results}>
              {flightOffers.length === 0 || hotelOffers.hotels.length === 0
                ? (
                  <span className={css.NoResult}>
                    No hotels or flights found, try another number of nights.
                  </span>
                )
                : (
                  <>
                    <Hotels
                      offers={hotelOffers}
                      hotelRoom={hotelRoom}
                      className={css.Hotels}
                      contentService={contentService}
                      occupants={occupants}
                      onSelectRoom={onSelectRoom}
                    />

                    <OnwardFlights
                      originalFare={originalFare}
                      offers={flightOffers}
                      className={css.OnwardFlights}
                      contentService={contentService}
                      onSelect={onSelectOnward}
                      onwardFare={onwardFare}
                    />
                  </>
                )}
            </div>
          )}
      </div>
    );
  }
}