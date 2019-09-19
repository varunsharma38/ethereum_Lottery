import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import axios from 'axios';

import Banner from './common/Banner'
import RegisterForLottery from './RegisterForLottery'
import Purchase from './Purchase'
import ViewTickets from './ViewTickets'

import {setPanelType} from '../redux/reducers/player';

import Web3Service from '../ethereum/ethereum-app-utility';
import '../styles/player.scss';
import { connect } from 'react-redux';

export class HomeComponent extends Component {
	constructor() {
		super();

		this.web3Service = Web3Service;
		this.getUserDetails();
		this.getLotteryStatus();

		this.state = {
			lotteryOpen: false,
			isRegistered: false
		};

		this.register = this.register.bind(this);
		this.buyTicket = this.buyTicket.bind(this);

		this.getPanelComponent = this.getPanelComponent.bind(this);

		this.getDataForBanner = this.getDataForBanner.bind(this);
	}

	getLotteryStatus() {
		this.web3Service.contract.methods.getLotteryState().call({from: this.userDetails.account, gasPrice: '10000000000000', gas: 1000000}, (err, resp) => {
			this.setState({
				lotteryOpen: resp === '1'
			});
		});
	}

	getUserDetails() {
		this.userDetails = {
			name: '',
			phone: '',
			userId: '',
			emailId: '',
			account: '',
			type: ''
		};
		location.href.split('?')[1].split('&').forEach((param) => {
			this.userDetails[param.split('=')[0]] = decodeURIComponent(param.split('=')[1]);
		});
		this.userDetails.account && this.web3Service.contract.methods.isPlayerRegistered().call({from: this.userDetails.account, gasPrice: '10000000000000', gas: 1000000}, (err, resp) => {
			this.setState({
				isRegistered: resp
			});
		})
	}

	register() {
		axios.post('/assignAccount',{
			userId: this.userDetails.userId
		})
		.then(response => {
			this.userDetails.account = response.data.account;
			this.web3Service.contract.methods.registerPlayer(this.userDetails.name, this.userDetails.emailId, this.userDetails.phone).send({from: this.userDetails.account, gasPrice: '10000000000000', gas: 1000000}, (err, resp) => {
				if(err) {
					console.log(err);
					return false;
				}
				this.setState({
					isRegistered: true
				});
				console.log(resp)
			});
		});
	}

	buyTicket() {
		this.web3Service.contract.methods.buyLotteryTickets().send({from: this.userDetails.account, gasPrice: '10000000000000', gas: 1000000}, function(err, resp) {
			if(err) {
				console.log(err);
				return false;
			}
			console.log(resp)
		});
	}

	getDataForBanner(){
		return;
	}

	getPanelComponent(banner) {
		switch(banner) {
			case 'register': 
				return <RegisterForLottery register={this.register} lotteryOpen={this.state.lotteryOpen} isRegistered={this.state.isRegistered} />;
			case 'purchase': 
				return <Purchase lotteryOpen={this.state.lotteryOpen} isRegistered={this.state.isRegistered} buyTicket={this.buyTicket}/>;
			case 'viewall': 
				return <ViewTickets/>;
			default: 
				return <RegisterForLottery register={this.register} lotteryOpen={this.state.lotteryOpen} isRegistered={this.state.isRegistered} />;
		}
	}

	render() {
		return <div className='container player-section'>
			{/* <div className='container'> */}
			{/* <div className='row'> */}
				<div className='col-lg player-sidebar'>
					<h2 className='sidebar-header d-flex justify-content-center'>
						Welcome, {this.userDetails.name}
					</h2>
					<div>
						<Banner 
							label='Register for Lottery' 
							isSelected={ this.props.selectedPanel==='register' } 
							onClick={() => this.props.setPanel('register') }
						/>
					</div>
					<div>
						<Banner 
							label='Purchase Ticket(s)' 
							isSelected={ this.props.selectedPanel==='purchase' } 
							onClick={() => this.props.setPanel('purchase') }
						/>
					</div>
					<div>
						<Banner 
							label='View My Tickets' 
							isSelected={this.props.selectedPanel==='viewall'} 
							onClick={() => this.props.setPanel('viewall') }
						/>
					</div>
				</div>
				<div className='col-lg pt-5 mt-5 pl-5 player-panel'>
					{this.getPanelComponent(this.props.selectedPanel)}
				</div>
			{/* </div></div>			 */}
		</div>;
	}
}

const mapStateToProps = (state) => ({
	selectedPanel: state.player.panelType
})

const mapDispatchToProps = (dispatch) => ({
	setPanel: (panel) => dispatch(setPanelType(panel))
})

export default connect(mapStateToProps, mapDispatchToProps)(HomeComponent)