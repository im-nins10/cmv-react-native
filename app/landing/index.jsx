import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  StatusBar 
} from 'react-native';
import { router } from 'expo-router';
import Navbar from '../../components/Navbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// 60-30-10 Color Scheme with updated blue (#002D72)
const COLORS = {
  // 60% - Primary/Dominant (Neutral backgrounds)
  primary: '#f8fafc',      // Main background
  primaryLight: '#ffffff', // Card backgrounds
  primaryDark: '#e2e8f0',  // Subtle borders
  
  // 30% - Secondary (Supporting colors) - Updated to #002D72
  secondary: '#002D72',    // Headers, important text
  secondaryLight: '#1a4b8c', // Buttons, links (lighter shade of #002D72)
  secondaryDark: '#001a4d', // Dark accents (darker shade of #002D72)
  
  // 10% - Accent (Highlights and CTAs)
  accent: '#dc2626',       // Important highlights
  accentLight: '#ef4444',  // Hover states
  accentGold: '#f59e0b',   // Special highlights
  
  // Supporting colors
  success: '#10b981',
  warning: '#f59e0b',
  text: '#1f2937',
  textLight: '#6b7280',
  textMuted: '#9ca3af',
};

// Icon Components (using Unicode symbols for better compatibility)
const Icons = {
  Document: () => <Text style={styles.icon}>📄</Text>,
  Target: () => <Text style={styles.icon}>🎯</Text>,
  Shield: () => <Text style={styles.icon}>🛡</Text>,
  Scale: () => <Text style={styles.icon}>⚖</Text>,
  Heart: () => <Text style={styles.icon}>♥</Text>,
  Flag: () => <Text style={styles.icon}>🏳</Text>,
  Users: () => <Text style={styles.icon}>👥</Text>,
  Leaf: () => <Text style={styles.icon}>🍃</Text>,
  Home: () => <Text style={styles.icon}>🏠</Text>,
  Settings: () => <Text style={styles.icon}>⚙</Text>,
  Book: () => <Text style={styles.icon}>📚</Text>,
  Dollar: () => <Text style={styles.icon}>💰</Text>,
};

export default function LandingPage() {
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [userRole, setUserRole] = useState('');

  // Helper function to capitalize first letter
  const capitalizeRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Get safe area color based on role - Updated to use #002D72
  const getSafeAreaColor = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin':
        return '#002D72';
      case 'investigator':
        return '#001a4d'; // Darker shade of #002D72
      default:
        return '#002D72';
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        const fullName = await AsyncStorage.getItem('fullName');
        setUserRole(role);
        
        if (role && fullName) {
          const formattedRole = capitalizeRole(role);
          setWelcomeMessage(`Welcome ${formattedRole} ${fullName}`);
        } else {
          setWelcomeMessage('Welcome');
        }
      } catch (error) {
        setWelcomeMessage('Welcome');
        setUserRole('');
      }
    };
    fetchUserData();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: getSafeAreaColor(userRole) }]}>
      <StatusBar barStyle="light-content" backgroundColor={getSafeAreaColor(userRole)} />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Navbar />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            
            
            <View style={styles.titleContainer}>
              <Text style={styles.welcomeText}>{welcomeMessage}</Text>
              <Text style={styles.heroTitle}>LIPA CITY</Text>
              <Text style={styles.heroSubtitle}>POLICE STATION</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>P.A.T.R.O.L. Plan 2030</Text>
                </View>
              </View>
              <Text style={styles.heroDescription}>
                Peace and Order Agenda for Transformation and Upholding of the Rule-Of-Law
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.quickInfoSection}>
          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <Icons.Document />
              </View>
              <Text style={styles.cardTitle}>MANDATE</Text>
              <Text style={styles.cardContent}>
                Republic Act 6975 as amended by RA 8551 and further amended by RA 9708
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <Icons.Target />
              </View>
              <Text style={styles.cardTitle}>VISION</Text>
              <Text style={styles.cardContent}>
                <Text style={styles.highlightText}>By 2030, </Text>
                a highly capable, effective and credible police service working in partnership with the community.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <Icons.Shield />
              </View>
              <Text style={styles.cardTitle}>MISSION</Text>
              <Text style={styles.cardContent}>
                Enforce law, prevent crimes, maintain peace and order, ensure public safety with community support.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoCard}>
              <View style={styles.cardIconContainer}>
                <Icons.Scale />
              </View>
              <Text style={styles.cardTitle}>PHILOSOPHY</Text>
              <Text style={styles.philosophyText}>
                Service, Honor, and Justice
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Core Values */}
        <View style={styles.valuesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CORE VALUES</Text>
            <Text style={styles.sectionSubtitle}>Guiding principles of our service</Text>
          </View>
          <View style={styles.valuesGrid}>
            {[
              { Icon: Icons.Heart, title: 'Maka-Diyos', subtitle: 'Pro-God' },
              { Icon: Icons.Flag, title: 'Makabayan', subtitle: 'Pro-Country' },
              { Icon: Icons.Users, title: 'Makatao', subtitle: 'Pro-People' },
              { Icon: Icons.Leaf, title: 'Makakalikasan', subtitle: 'Pro-Environment' },
            ].map((value, index) => (
              <TouchableOpacity key={index} style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <value.Icon />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  <Text style={styles.valueSubtitle}>({value.subtitle})</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Strategic Goals */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>STRATEGIC ROADMAP 2030</Text>
            <Text style={styles.sectionSubtitle}>Highly Capable, Effective, and Credible Police Service</Text>
          </View>

          {/* Community Layer */}
          <View style={styles.goalLayer}>
            <View style={styles.layerHeader}>
              <View style={styles.layerIconContainer}>
                <Icons.Home />
              </View>
              <View style={styles.layerHeaderText}>
                <Text style={styles.layerTitle}>COMMUNITY</Text>
                <Text style={styles.layerSubtitle}>A Safer Place to Live, Work, and do Business</Text>
              </View>
            </View>
          </View>

          {/* Process Excellence Layer */}
          <View style={styles.goalLayer}>
            <View style={styles.layerHeader}>
              <View style={styles.layerIconContainer}>
                <Icons.Settings />
              </View>
              <View style={styles.layerHeaderText}>
                <Text style={styles.layerTitle}>PROCESS EXCELLENCE</Text>
                <Text style={styles.layerSubtitle}>Operational effectiveness and efficiency</Text>
              </View>
            </View>
            <View style={styles.goalsGrid}>
              {[
                'Improve Crime Prevention',
                'Improve Crime Solution',
                'Improve Human Rights-based Policing',
                'Improve Public Safety Support'
              ].map((goal, index) => (
                <TouchableOpacity key={index} style={styles.goalCard}>
                  <Text style={styles.goalText}>{goal}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Learning and Growth Layer */}
          <View style={styles.goalLayer}>
            <View style={styles.layerHeader}>
              <View style={styles.layerIconContainer}>
                <Icons.Book />
              </View>
              <View style={styles.layerHeaderText}>
                <Text style={styles.layerTitle}>LEARNING & GROWTH</Text>
                <Text style={styles.layerSubtitle}>Personnel development and organizational growth</Text>
              </View>
            </View>
            <View style={styles.goalsGrid}>
              {[
                'Recruit Quality Applicants',
                'Develop Competent Personnel',
                'Build Professional Organization'
              ].map((goal, index) => (
                <TouchableOpacity key={index} style={styles.goalCard}>
                  <Text style={styles.goalText}>{goal}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Resource Management Layer */}
          <View style={styles.goalLayer}>
            <View style={styles.layerHeader}>
              <View style={styles.layerIconContainer}>
                <Icons.Dollar />
              </View>
              <View style={styles.layerHeaderText}>
                <Text style={styles.layerTitle}>RESOURCE MANAGEMENT</Text>
                <Text style={styles.layerSubtitle}>Efficient resource utilization</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.goalCard, styles.fullWidth]}>
              <Text style={styles.goalText}>Optimize Financial and Logistical Resources</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>© 2025 Lipa City Police Station</Text>
            <Text style={styles.footerSubtext}>Serving with Honor and Excellence</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color will be set dynamically based on role
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.primary, // Content area remains white
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Icon Styles
  icon: {
    fontSize: 20,
    color: COLORS.secondary,
  },

  // Hero Section
  heroSection: {
    marginBottom: 24,
    backgroundColor: COLORS.primary, // White background
    paddingTop: 20,
  },
  heroContent: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 18, // Bigger welcome message
    color: COLORS.secondary,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 32, // Emphasized title
    fontWeight: '900', // Maximum weight for emphasis
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 20, // Larger subtitle
    fontWeight: '700', // Bold subtitle
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    marginBottom: 12,
  },
  badge: {
    backgroundColor: COLORS.accent, // 10% - Accent color for badge
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700', // Bold badge text
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
  },

  // Section Headers
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24, // Large section titles
    fontWeight: '800', // Very bold
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Quick Info Cards
  quickInfoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.primaryLight, // 60% - Card backgrounds
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 16, // Emphasized card titles
    fontWeight: '700', // Bold titles
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  cardContent: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  highlightText: {
    fontWeight: '700', // Bold highlights
    color: COLORS.accent, // 10% - Accent for highlights
  },
  philosophyText: {
    fontWeight: '700', // Bold philosophy
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
  },

  // Core Values
  valuesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  valuesGrid: {
    gap: 12,
  },
  valueCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  valueIconContainer: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold for value titles
    color: COLORS.secondary,
    marginBottom: 2,
  },
  valueSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '400',
  },

  // Strategic Goals
  goalsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  goalLayer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  layerIconContainer: {
    backgroundColor: COLORS.secondary, // 30% - Icon backgrounds with #002D72
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  layerHeaderText: {
    flex: 1,
  },
  layerTitle: {
    fontSize: 18, // Larger layer titles
    fontWeight: '700', // Bold layer titles
    color: COLORS.secondary,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  layerSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '400',
  },
  goalsGrid: {
    gap: 10,
  },
  goalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent, // 10% - Accent borders
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  fullWidth: {
    width: '100%',
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600', // Semi-bold goal text
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: COLORS.secondary, // 30% - Footer background with #002D72
    marginTop: 32,
  },
  footerContent: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '600', // Semi-bold footer text
    marginBottom: 4,
  },
  footerSubtext: {
    color: COLORS.primaryLight,
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '400',
  },
});