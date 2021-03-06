import React from 'react';
import css from './DateSelector.module.css';

import EventItemBg1 from '../../../../../../../../../../../Assets/Images/Experimental/EventItem1-Bg.jpg';
import EventItemBg2 from '../../../../../../../../../../../Assets/Images/Experimental/EventItem2-Bg.jpg';
import EventItemBg3 from '../../../../../../../../../../../Assets/Images/Experimental/EventItem3-Bg.jpg';

import EventSlider from './Components/EventSlider';
import ContentService from '../../../../../../../../../../../Services/ContentService';
import DateUtils from '../../../../../../../../../../../DateUtils';
import PriceCalendar from '../../../../../../../../../Components/PriceCalendar';
import { DatePriceModel } from '../../../../../../../../../MockData';

interface DateSelectorProps {
  dateInfo: any;
  datePrice?: DatePriceModel[];
  contentService: ContentService;
  changeDate: Function;
  setShowDropDown: Function;
}

interface DateSelectorState {
  collapsed: boolean;
  dateInfo: any;
}

export default class DateSelector extends React.Component<DateSelectorProps, DateSelectorState> {
  private readonly selfRef = React.createRef<HTMLDivElement>();

  private readonly calendarRef = React.createRef<PriceCalendar>();

  private EventData = [
    {
      title: 'Wildlife Photographer of the Year',
      date: '1 Oct - 31 Oct',
      backImg: EventItemBg1,
    },
    {
      title: 'Boothill Markets',
      date: '20 Aug - 31 Dec',
      backImg: EventItemBg2,
    },
    {
      title: 'Sydney Harbour Halloween Party Cruise',
      date: '31 Oct',
      backImg: EventItemBg3,
    },
  ]

  constructor(props: DateSelectorProps) {
    super(props);
    const { dateInfo } = props;
    this.state = {
      collapsed: true,
      dateInfo,
    };
    this.onChange = this.onChange.bind(this);
    this.expand = this.expand.bind(this);
    this.collapse = this.collapse.bind(this);
    this.onClickOutside = this.onClickOutside.bind(this);
    this.onFocusIn = this.onFocusIn.bind(this);
  }

  componentDidMount(): void {
    document.addEventListener('mousedown', this.onClickOutside);
    document.addEventListener('focusin', this.onFocusIn);
  }

  componentDidUpdate(prevProps: DateSelectorProps): void {
    const { dateInfo } = this.props;
    if (prevProps.dateInfo !== dateInfo) {
      this.setState({
        dateInfo,
      });
    }
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.onClickOutside);
    document.removeEventListener('focusin', this.onFocusIn);
  }

  private onFocusIn(e: any): void {
    this.onClickOutside(e);
  }

  private onClickOutside(e: any): void {
    if (!this.selfRef.current || this.selfRef.current.contains(e.target)) {
      return;
    }

    this.collapse();
  }

  private onChange(start: Date | undefined, end: Date | undefined): void {
    this.setState({
      dateInfo: { start, end },
    });
  }

  private expand(): void {
    const { collapsed } = this.state;
    const { setShowDropDown } = this.props;

    if (collapsed) {
      this.setState({ collapsed: false });
      setShowDropDown(true);
    }
  }

  private collapse(): void {
    const { collapsed } = this.state;
    const { setShowDropDown, dateInfo } = this.props;

    if (!collapsed) {
      this.setState({
        collapsed: true,
        dateInfo,
      });
      setShowDropDown(false);
    }
  }

  private clickDone(): void {
    const { changeDate } = this.props;
    const { dateInfo } = this.state;
    this.collapse();
    changeDate(dateInfo);
  }

  private renderTitleDate(): string {
    const { contentService, dateInfo } = this.props;
    const startDateStr = dateInfo.start.toLocaleDateString(
      contentService.locale,
      { month: 'short', day: 'numeric' },
    );
    const startDateArr = startDateStr.split(' ');

    const endDateStr = dateInfo.end.toLocaleDateString(
      contentService.locale,
      { month: 'short', day: 'numeric' },
    );
    const endDateArr = endDateStr.split(' ');

    return `${startDateArr[1]} ${startDateArr[0]} - ${endDateArr[1]} ${endDateArr[0]}`;
  }

  private renderFooterDate(): string {
    const { contentService } = this.props;
    const { dateInfo } = this.state;
    if (dateInfo.start && dateInfo.end) {
      const startDateStr = dateInfo.start.toLocaleDateString(
        contentService.locale,
        { month: 'short', day: 'numeric' },
      );
      const startDateArr = startDateStr.split(' ');

      const endDateStr = dateInfo.end.toLocaleDateString(
        contentService.locale,
        { month: 'short', day: 'numeric' },
      );
      const endDateArr = endDateStr.split(' ');

      const startResult = `${startDateArr[1]} ${startDateArr[0]}`;
      const endResult = `${endDateArr[1]} ${endDateArr[0]}`;
      const nightValue = DateUtils.getDaysDelta(dateInfo.end, dateInfo.start);
      const nightResult = `(${nightValue} night${nightValue > 0 ? 's' : ''})`;

      return `${startResult} to ${endResult} ${nightResult}`;
    } return '';
  }

  render(): JSX.Element {
    const { contentService, datePrice } = this.props;
    const { collapsed, dateInfo } = this.state;

    const titleClassList = [css.DateValue];
    if (collapsed) { titleClassList.push(css.Collapsed); }
    return (
      <div
        className={css.ComponentContainer}
        ref={this.selfRef}
        onFocus={this.expand}
      >
        <div
          className={titleClassList.join(' ')}
          onClick={(): void => {
            this.expand();
          }}
          role="button"
        >
          {this.renderTitleDate()}
          <span className={css.ChevArrow} />
        </div>
        {!collapsed
          && (
          <div className={css.DropDownContainer}>
            <div className={css.CalendarContainer}>
              <PriceCalendar
                start={dateInfo.start}
                end={dateInfo.end}
                ref={this.calendarRef}
                contentService={contentService}
                span
                onChange={(start, end): void => this.onChange(start, end)}
                datePrice={datePrice}
              />
              <div className={css.Footer}>
                <div>{this.renderFooterDate()}</div>
                <div className={css.ReturnTrip}>
                  Round trip from AED 675
                </div>
                <div
                  className={css.DoneButton}
                  onClick={() => { this.clickDone(); }}
                  role="button"
                >
                  Done
                </div>
              </div>
            </div>
            <div className={css.RightSection}>
              <div className={css.Title}>Sydney in October</div>
              <div className={css.Description}>
                <div><strong><i>Season</i></strong></div>
                <div>Spring</div>
              </div>
              <div className={css.Description}>
                <div><strong><i>Avg. Temperature</i></strong></div>
                <div>22°C</div>
              </div>
              <div className={css.Description}>
                <div><strong><i>Weather</i></strong></div>
                <div>Sunny and cool with occasional light rain</div>
              </div>
              <div className={css.Events}>
                <div className={css.Title}><strong><i>Events</i></strong></div>
                <EventSlider eventItems={this.EventData} />
              </div>
            </div>
          </div>
          )}
      </div>
    );
  }
}
