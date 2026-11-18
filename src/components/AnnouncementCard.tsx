import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Announcement } from '../models/announcement.model';

interface AnnouncementCardProps {
  announcement: Announcement;
}

/**
 * Tarjeta individual para mostrar un aviso académico en CampusConnect
 */
export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const getCategoryColor = (category: Announcement['category']) => {
    switch (category) {
      case 'Institucional':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'Académico':
        return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' };
      case 'Evento':
        return { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' };
      case 'Fechas Importantes':
        return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
      default:
        return { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' };
    }
  };

  const badgeColors = getCategoryColor(announcement.category);

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityRole="article"
      accessibilityLabel={`${announcement.category}: ${announcement.title}`}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeColors.text }]}>
            {announcement.category}
          </Text>
        </View>
        <Text style={styles.idText}>Aviso #{announcement.id}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {announcement.title}
      </Text>

      <Text style={styles.body}>{announcement.body}</Text>

      <View style={styles.footer}>
        <Text style={styles.dateText}>📅 {announcement.formattedDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 22,
    textTransform: 'capitalize',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
