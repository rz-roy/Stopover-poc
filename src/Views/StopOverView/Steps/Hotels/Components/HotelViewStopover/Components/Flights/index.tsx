import React from 'react';
import css from '../../../../Hotels.module.css';
import Plane from '../../../../../../../../Assets/Images/plane.svg';
import FlightCard from './Components/FlightCard';
import {
  AirSearchResults,
} from '../../../../../../../../Services/Responses/ConfirmStopOverResponse';

interface FlightState {
  showFlightsCount: number;
}

interface FlightProps {
  airSearchResults?: AirSearchResults;
  selectFlight: Function;
  selectedFlightId: string;
}

export class Flights extends React.Component<FlightProps, FlightState> {
  constructor(props: FlightProps) {
    super(props);
    this.state = {
      showFlightsCount: 3,
    };
  }

  componentDidUpdate(prevProps: FlightProps): void {
    const { airSearchResults } = this.props;
    if (prevProps.airSearchResults !== airSearchResults) {
      const listLength = this.getOnwardsSegmentOfferLength(airSearchResults);
      this.setState({
        showFlightsCount: listLength > 3 ? 3 : listLength,
      });
    }
  }

  private getOnwardsSegmentOfferLength(airSearchResults?: AirSearchResults): number {
    if (airSearchResults === undefined) { return 0; }
    return airSearchResults.segmentContextShoppingResults.onwardsSegmentOffers.length;
  }

  private handleAddMore(): void {
    const { showFlightsCount } = this.state;
    const { airSearchResults } = this.props;
    const listLength = this.getOnwardsSegmentOfferLength(airSearchResults);

    if (showFlightsCount === listLength) {
      this.setState({
        showFlightsCount: 3,
      });
    } else if (showFlightsCount < listLength) {
      this.setState({
        showFlightsCount: listLength - showFlightsCount > 3 ? showFlightsCount + 3 : listLength,
      });
    }
  }

  private renderSelectedSegment(): JSX.Element[] {
    const returnRender: JSX.Element[] = [];
    const { airSearchResults, selectFlight, selectedFlightId } = this.props;

    if (airSearchResults !== undefined) {
      airSearchResults.segmentContextShoppingResults.selectedSegments.forEach((item: any, idx: number): void => {
        returnRender.push(
          <FlightCard
            key={`selected-segment-${idx}`}
            segment={item}
            selectFlight={(flightId: number): void => { selectFlight(flightId); }}
            selectedFlightId={selectedFlightId}
          />,
        );
      });
    }

    return returnRender;
  }

  private renderOfferSegments(): JSX.Element[] {
    const returnRender: JSX.Element[] = [];
    const { airSearchResults, selectFlight, selectedFlightId } = this.props;
    const { showFlightsCount } = this.state;

    if (airSearchResults !== undefined) {
      airSearchResults.segmentContextShoppingResults.onwardsSegmentOffers.forEach(
        (item: any, idx: number): void => {
          if (item.onwardsSegments && item.onwardsSegments.length > 0) {
            if (idx < showFlightsCount) {
              returnRender.push(
                <FlightCard
                  key={`offer-${idx}`}
                  segment={item.onwardsSegments[0]}
                  selectFlight={(flightId: number): void => { selectFlight(flightId); }}
                  selectedFlightId={selectedFlightId}
                  differenceFromLowestPrice={item.onwardsSegments.differenceFromLowestPrice}
                />,
              );
            }
          }
        },
      );

      const listLength = airSearchResults.segmentContextShoppingResults.onwardsSegmentOffers.length;
      if (showFlightsCount < listLength) {
        returnRender.push(
          <div
            className={css.MoreFlights}
            onClick={(): void => this.handleAddMore()}
            role="button"
          >
            {
              showFlightsCount < listLength ? (
                <>
                  <span className={css.AngleUp} />
                  <p>{`${listLength - showFlightsCount > 3 ? 3 : listLength - showFlightsCount} more flights`}</p>
                </>
              )
                : (
                  <>
                    <span className={css.AngleDown} />
                    <p>Show only 3 flights</p>
                  </>
                )
            }
          </div>,
        );
      }
    }

    return returnRender;
  }

  render(): JSX.Element {
    return (
      <div className={css.RightWrap}>
        <div className={css.HotelTop}>
          <img src={Plane} alt="" />
          <p style={{ marginBottom: '0px' }}>Select your onward flight:</p>
          <p className={css.DayDuaration}>Adu Dhabi to Melbourne, 05 June 2020</p>
        </div>
        <div className={css.RightCard}>
          {this.renderSelectedSegment()}
        </div>

        <div className={css.RightCard}>
          {this.renderOfferSegments()}
        </div>
      </div>
    );
  }
}
