import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Navbar from '../../components/Navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LandingPage() {
  const [welcomeMessage, setWelcomeMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        const fullName = await AsyncStorage.getItem('fullName');
        if (role && fullName) {
          setWelcomeMessage(`Welcome ${role} ${fullName}`);
        } else {
          setWelcomeMessage('Welcome');
        }
      } catch (error) {
        setWelcomeMessage('Welcome');
      }
    };
    fetchUserData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Navbar />

      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logoLarge} />
        <View style={styles.titles}>
          <Text style={styles.welcomeText}>{welcomeMessage}</Text>
          <Text style={styles.title1}>LIPA CITY POLICE STATION</Text>
          <Text style={styles.title2}>P.A.T.R.O.L. Plan 2030 Roadmap</Text>
          <Text style={styles.title3}>
            Peace and Order Agenda for Transformation and Upholding of the Rule-Of-Law
          </Text>
        </View>
        <Image source={require('../../assets/images/logo1.png')} style={styles.logoLarge} />
      </View>

      {/* Mandate & Vision */}
      <View style={styles.sectionRow}>
        <View style={styles.box}>
          <Text style={styles.boxHeader}>MANDATE</Text>
          <Text>Republic Act 6975 as amended by RA 8551 and further amended by RA 9708</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxHeader}>VISION</Text>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>Imploring the aid of the Almighty, by 2030, </Text>
            We shall be a highly capable, effective and credible police service working in
            partnership with a responsive community towards the attainment of a safer place to live,
            work, and do business.
          </Text>
        </View>
      </View>

      {/* Mission & Philosophy */}
      <View style={styles.sectionRow}>
        <View style={styles.box}>
          <Text style={styles.boxHeader}>MISSION</Text>
          <Text>
            Enforce the law, prevent and control crimes, maintain peace and order, and ensure public
            safety and internal security with the active support of the community.
          </Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxHeader}>PHILOSOPHY</Text>
          <Text>Service, Honor, and Justice</Text>
        </View>
      </View>

      {/* Core Values */}
      <View style={styles.section}>
        <Text style={styles.sectionHeaderCenter}>CORE VALUES</Text>
        {[
          'Maka-Diyos (Pro-God)',
          'Makabayan (Pro-Country)',
          'Makatao (Pro-People)',
          'Makakalikasan (Pro-Environment)',
        ].map((value, i) => (
          <Text key={i}>• {value}</Text>
        ))}
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeaderCenter}>
          HIGHLY CAPABLE, EFFECTIVE, AND CREDIBLE POLICE SERVICE BY 2030
        </Text>

        <View style={styles.layer}>
          <Text style={styles.layerTitleBlueCenter}>COMMUNITY</Text>
          <Text style={styles.layerSubtitleCenter}>
            A Safer Place to Live, Work, and do Business
          </Text>
        </View>

        <View style={styles.layer}>
          <Text style={styles.layerTitleGrayCenter}>PROCESS EXCELLENCE</Text>
          <View style={styles.grid2x2}>
            <Text style={[styles.goalBox, { backgroundColor: '#C62828' }]}>
              Improve Crime Prevention
            </Text>
            <Text style={[styles.goalBox, { backgroundColor: '#C62828' }]}>
              Improve Crime Solution
            </Text>
            <Text style={[styles.goalBox, { backgroundColor: '#C62828' }]}>
              Improve Human Rights-based, Community and Service-oriented Policing
            </Text>
            <Text style={[styles.goalBox, { backgroundColor: '#C62828' }]}>
              Improve Support to Public Safety and Internal Security
            </Text>
          </View>
        </View>

        <View style={styles.layer}>
          <Text style={styles.layerTitleGrayCenter}>LEARNING AND GROWTH</Text>
          <View style={styles.grid3}>
            <Text style={[styles.goalBox, { backgroundColor: '#2E7D32' }]}>
              Recruit Quality Applicants
            </Text>
            <Text style={[styles.goalBox, { backgroundColor: '#2E7D32' }]}>
              Develop Competent, Motivated, Values-oriented and Disciplined PNP Personnel
            </Text>
            <Text style={[styles.goalBox, { backgroundColor: '#2E7D32' }]}>
              Develop a Responsive and Highly Professional Police Organization
            </Text>
          </View>
        </View>

        <View style={styles.layer}>
          <Text style={styles.layerTitleGrayCenter}>RESOURCE MANAGEMENT</Text>
          <View style={styles.grid1}>
            <Text style={[styles.goalBox, { backgroundColor: '#F9A825' }]}>
              Optimize Use of Financial and Logistical Resources
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={{ color: 'white' }}>© 2025 City Police Station</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f5f5f5' },
  navbar: {
    backgroundColor: '#002D72',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navbarBrand: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
    gap: 16,
    paddingLeft: 20,
  },
  navLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 4,
  },
  navLink: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  logoSmall: { height: 32, width: 32, resizeMode: 'contain' },
  logoLarge: { height: 80, width: 80, resizeMode: 'contain' },
  titles: { flex: 1, alignItems: 'center', paddingHorizontal: 10, textAlign: 'center' },
  title1: { fontSize: 20, fontWeight: 'bold', color: 'darkblue', textAlign: 'center' },
  title2: { fontSize: 16, fontWeight: '600', color: 'darkblue', textAlign: 'center' },
  title3: { fontSize: 12, textAlign: 'center', color: '#333' },

  sectionRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sectionHeaderCenter: {
    textAlign: 'center',
    backgroundColor: '#0056b3',
    color: 'white',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 16,
    borderRadius: 4,
    marginBottom: 10,
  },
  box: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  boxHeader: {
    backgroundColor: '#0056b3',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
    borderRadius: 4,
    marginBottom: 6,
  },

  layer: {
    marginBottom: 20,
  },
  layerTitleBlueCenter: {
    backgroundColor: '#0C4DA2',
    color: 'white',
    fontSize: 18,
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  layerSubtitleCenter: {
    backgroundColor: '#2C72BA',
    color: 'white',
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  layerTitleGrayCenter: {
    backgroundColor: '#444',
    color: 'white',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  goalBox: {
    flexBasis: '48%',
    color: 'white',
    padding: 10,
    fontWeight: 'bold',
    borderRadius: 4,
    textAlign: 'center',
  },
  grid1: { gap: 10 },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  grid3: { gap: 10 },

  footer: {
    backgroundColor: '#002D72',
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
  },
});
